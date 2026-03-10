import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_id, product_name, reference_images } = await req.json();

    if (!product_id || !product_name) {
      return new Response(
        JSON.stringify({ error: "product_id and product_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the analysis data for this product
    const { data: cached } = await supabase
      .from("furniture_analysis_cache")
      .select("analysis")
      .eq("product_id", product_id)
      .maybeSingle();

    const analysis = cached?.analysis || {};

    // Build prompt for image generation
    const prompt = buildImagePrompt(product_name, analysis, reference_images || []);

    // Generate image using Gemini image model
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const modelsToTry = [
      "google/gemini-3.1-flash-image-preview",
      "google/gemini-3-pro-image-preview",
    ];

    let generatedImageUrl: string | null = null;

    for (const model of modelsToTry) {
      try {
        const messages: any[] = [
          {
            role: "user",
            content: prompt,
          },
        ];

        // Add reference images if available
        if (reference_images && reference_images.length > 0) {
          messages[0] = {
            role: "user",
            content: [
              { type: "text", text: prompt },
              ...reference_images.slice(0, 3).map((url: string) => ({
                type: "image_url",
                image_url: { url },
              })),
            ],
          };
        }

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            modalities: ["image", "text"],
          }),
        });

        if (response.status === 402) {
          clearTimeout(timeout);
          return new Response(
            JSON.stringify({ error: "AI 크레딧이 부족합니다." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (response.status === 429) {
          continue;
        }

        if (!response.ok) continue;

        const data = await response.json();
        const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageData && imageData.startsWith("data:image/")) {
          // Upload to storage
          const base64 = imageData.split(",")[1];
          const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
          const path = `${product_id}/ai-gen-${Date.now()}.png`;

          const { error: uploadError } = await supabase.storage
            .from("furniture-references")
            .upload(path, bytes, {
              contentType: "image/png",
              cacheControl: "3600",
              upsert: false,
            });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("furniture-references")
              .getPublicUrl(path);
            generatedImageUrl = urlData?.publicUrl || null;
          }
          break;
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") break;
        console.error(`Model ${model} error:`, e);
        continue;
      }
    }

    clearTimeout(timeout);

    if (!generatedImageUrl) {
      return new Response(
        JSON.stringify({ error: "이미지 생성에 실패했습니다." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ generated_urls: [generatedImageUrl] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-furniture-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildImagePrompt(
  productName: string,
  analysis: Record<string, unknown>,
  referenceImages: string[]
): string {
  const type = (analysis.furnitureType as string) || "furniture";
  const material = (analysis.primaryMaterial as string) || "wood";
  const color = (analysis.primaryColor as string) || "#c8a87c";
  const legStyle = (analysis.legStyle as string) || "4-legs";
  const shape = (analysis.shape as string) || "rectangular";

  let prompt = `Generate a photorealistic 3D rendering of a Korean office/educational furniture product.

Product: "${productName}"
Type: ${type}
Shape: ${shape}  
Material: ${material}
Primary Color: ${color}
Secondary Color: ${(analysis.secondaryColor as string) || "#333333"}
Leg Style: ${legStyle}

Requirements:
- Clean white/light gray studio background
- Professional product photography angle (3/4 view)
- Accurate material textures (wood grain, metal finish, fabric weave)
- Proper shadows and lighting
- No text or watermarks
- High detail on edges, joints, and hardware`;

  if (referenceImages.length > 0) {
    prompt += `\n\nReference images are provided. Match the style, proportions, and details as closely as possible.`;
  }

  const details = (analysis.details as string[]) || [];
  if (details.length > 0) {
    prompt += `\nSpecific details to include: ${details.join(", ")}`;
  }

  return prompt;
}
