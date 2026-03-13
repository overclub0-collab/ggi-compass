import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ViewAngle {
  id: string;
  name: string;
  prompt: string;
}

const VIEW_ANGLES: ViewAngle[] = [
  {
    id: "quarter-front",
    name: "쿼터뷰 (전면)",
    prompt: "3/4 front view angle, slightly elevated camera at 30 degrees above eye level, showing the front and one side of the furniture",
  },
  {
    id: "quarter-back",
    name: "쿼터뷰 (후면)",
    prompt: "3/4 rear view angle, slightly elevated camera at 30 degrees, showing the back and one side of the furniture, revealing back panel and structural details",
  },
  {
    id: "top-down",
    name: "탑뷰 (상면)",
    prompt: "Top-down bird's eye view, camera directly above looking straight down, showing the full surface area and layout of the furniture",
  },
  {
    id: "side-left",
    name: "사이드뷰 (좌측)",
    prompt: "Left side profile view, camera at eye level looking directly at the left side, showing depth and side structure details",
  },
  {
    id: "front",
    name: "정면뷰",
    prompt: "Front-facing straight-on view at eye level, showing the full front facade, symmetry, and front panel details",
  },
  {
    id: "detail-close",
    name: "디테일 클로즈업",
    prompt: "Close-up detail shot focusing on material texture, joint construction, hardware, edge treatment, and surface finish quality",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_id, product_name, reference_images, view_angles } = await req.json();

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

    // Determine which views to generate
    const selectedAngles: ViewAngle[] = view_angles && view_angles.length > 0
      ? VIEW_ANGLES.filter(v => view_angles.includes(v.id))
      : VIEW_ANGLES.slice(0, 3); // Default: quarter-front, quarter-back, top-down

    const generatedUrls: Array<{ view_id: string; view_name: string; url: string }> = [];
    const errors: string[] = [];

    for (const angle of selectedAngles) {
      const prompt = buildImagePrompt(product_name, analysis, reference_images || [], angle);

      const modelsToTry = [
        "google/gemini-3.1-flash-image-preview",
        "google/gemini-3-pro-image-preview",
      ];

      let generated = false;

      for (const model of modelsToTry) {
        try {
          const messages: any[] = [];
          const contentParts: any[] = [{ type: "text", text: prompt }];

          // Add reference images for context
          if (reference_images && reference_images.length > 0) {
            for (const url of reference_images.slice(0, 4)) {
              contentParts.push({
                type: "image_url",
                image_url: { url },
              });
            }
          }

          messages.push({ role: "user", content: contentParts });

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 60000);

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

          clearTimeout(timeout);

          if (response.status === 402) {
            return new Response(
              JSON.stringify({ error: "AI 크레딧이 부족합니다.", generated_results: generatedUrls }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          if (response.status === 429) {
            // Wait and retry with next model
            await new Promise(r => setTimeout(r, 3000));
            continue;
          }

          if (!response.ok) continue;

          const data = await response.json();
          const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (imageData && imageData.startsWith("data:image/")) {
            const base64 = imageData.split(",")[1];
            const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const path = `${product_id}/ai-${angle.id}-${Date.now()}.png`;

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
              if (urlData?.publicUrl) {
                generatedUrls.push({
                  view_id: angle.id,
                  view_name: angle.name,
                  url: urlData.publicUrl,
                });
                generated = true;
              }
            }
            break;
          }
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") break;
          console.error(`Model ${model} error for ${angle.id}:`, e);
          continue;
        }
      }

      if (!generated) {
        errors.push(angle.name);
      }

      // Small delay between generations to avoid rate limits
      if (selectedAngles.indexOf(angle) < selectedAngles.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (generatedUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "이미지 생성에 실패했습니다.", errors }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        generated_results: generatedUrls,
        generated_urls: generatedUrls.map(r => r.url),
        errors: errors.length > 0 ? errors : undefined,
      }),
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
  referenceImages: string[],
  viewAngle: ViewAngle
): string {
  const type = (analysis.furnitureType as string) || "furniture";
  const material = (analysis.primaryMaterial as string) || "wood";
  const color = (analysis.primaryColor as string) || "#c8a87c";
  const secondaryColor = (analysis.secondaryColor as string) || "#333333";
  const legStyle = (analysis.legStyle as string) || "4-legs";
  const shape = (analysis.shape as string) || "rectangular";
  const topThickness = (analysis.topThickness as number) || 0.03;

  let prompt = `Generate a photorealistic product rendering of Korean office/educational furniture.

Product: "${productName}"
Type: ${type}
Shape: ${shape}
Material: ${material}
Primary Color: ${color}
Secondary Color: ${secondaryColor}
Leg Style: ${legStyle}
Top Thickness: ${Math.round(topThickness * 1000)}mm

Camera Angle: ${viewAngle.prompt}

Critical Requirements:
- Clean white/light gray infinite studio background with soft gradient
- Professional product photography lighting (3-point studio setup)
- Accurate PBR material textures: real wood grain patterns, brushed/polished metal reflections, fabric weave texture
- Precise shadow rendering with soft ambient occlusion
- High detail on edges, joints, screws, handles, and all hardware
- No text, watermarks, or logos
- Furniture must be the ONLY object in the scene
- Photorealistic quality matching professional catalog photography`;

  if (referenceImages.length > 0) {
    prompt += `\n\nIMPORTANT: Reference images of the actual product are provided. You MUST closely match:
- The exact proportions and dimensions
- The specific material finishes and color tones
- All structural details, hardware, and edge treatments
- The overall design language and style
Generate the view as if photographing the SAME product from the specified angle.`;
  }

  // Add structural details
  const hasDrawer = analysis.hasDrawer as boolean;
  const hasDoor = analysis.hasDoor as boolean;
  const hasShelf = analysis.hasShelf as boolean;
  const drawerCount = (analysis.drawerCount as number) || 0;
  const doorCount = (analysis.doorCount as number) || 0;
  const shelfCount = (analysis.shelfCount as number) || 0;

  const structuralDetails: string[] = [];
  if (hasDrawer && drawerCount > 0) structuralDetails.push(`${drawerCount} drawers with handles`);
  if (hasDoor && doorCount > 0) structuralDetails.push(`${doorCount} doors with hinges`);
  if (hasShelf && shelfCount > 0) structuralDetails.push(`${shelfCount} shelves`);
  if (analysis.hasArmrest) structuralDetails.push("armrests");
  if (analysis.hasBackrest) structuralDetails.push("backrest");

  if (structuralDetails.length > 0) {
    prompt += `\nStructural elements: ${structuralDetails.join(", ")}`;
  }

  const details = (analysis.details as string[]) || [];
  if (details.length > 0) {
    prompt += `\nAdditional details: ${details.join(", ")}`;
  }

  // Texture info
  const texture = analysis.texture as Record<string, unknown> | undefined;
  if (texture) {
    const woodGrain = texture.woodGrain as Record<string, unknown> | undefined;
    if (woodGrain) {
      prompt += `\nWood grain: ${woodGrain.direction} direction, ${woodGrain.intensity} intensity, color ${woodGrain.grainColor || color}`;
    }
    const metalFinish = texture.metalFinish as Record<string, unknown> | undefined;
    if (metalFinish) {
      prompt += `\nMetal finish: ${metalFinish.type}${metalFinish.brushDirection ? `, ${metalFinish.brushDirection} brush` : ""}`;
    }
  }

  return prompt;
}
