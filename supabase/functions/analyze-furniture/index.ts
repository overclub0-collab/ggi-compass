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
    const { product_id, image_url, product_name } = await req.json();

    if (!product_id || !image_url) {
      return new Response(
        JSON.stringify({ error: "product_id and image_url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first
    const { data: cached } = await supabase
      .from("furniture_analysis_cache")
      .select("analysis")
      .eq("product_id", product_id)
      .maybeSingle();

    if (cached?.analysis && Object.keys(cached.analysis).length > 0) {
      return new Response(JSON.stringify({ analysis: cached.analysis, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Gemini Vision to analyze the furniture image
    const systemPrompt = `You are a furniture 3D modeling expert. Analyze the furniture product image and extract precise parameters for procedural 3D model generation using Three.js.

Return a JSON object with these fields:
{
  "furnitureType": "desk" | "chair" | "storage" | "shelf" | "sofa" | "lab" | "dining" | "roundtable" | "blackboard" | "bunkbed" | "pet" | "generic",
  "shape": "rectangular" | "round" | "L-shaped" | "curved" | "irregular",
  "topShape": "rectangular" | "round" | "oval" | "irregular",
  "legStyle": "4-legs" | "T-frame" | "pedestal" | "sled" | "star-base" | "panel" | "trestle" | "none",
  "legCount": number,
  "hasArmrest": boolean,
  "hasBackrest": boolean,
  "hasDrawer": boolean,
  "drawerCount": number,
  "hasDoor": boolean,
  "doorCount": number,
  "hasShelf": boolean,
  "shelfCount": number,
  "hasCushion": boolean,
  "primaryMaterial": "wood" | "metal" | "fabric" | "plastic" | "glass" | "leather",
  "secondaryMaterial": "wood" | "metal" | "fabric" | "plastic" | "glass" | "none",
  "primaryColor": "#hexcolor",
  "secondaryColor": "#hexcolor",
  "accentColor": "#hexcolor",
  "topThickness": number (ratio 0.01-0.1 relative to height),
  "legThickness": number (ratio 0.02-0.1 relative to width),
  "proportions": {
    "widthToDepthRatio": number,
    "heightToWidthRatio": number,
    "seatHeightRatio": number (for chairs, 0-1 ratio of total height)
  },
  "details": string[] (list of notable visual details like "crossbar", "curved-back", "tapered-legs", "rounded-edges", "metal-frame", "wood-grain", "upholstered", etc),
  "texture": {
    "woodGrain": { ... },
    "fabricPattern": { ... },
    "metalFinish": { ... },
    "surfaceFinish": "glossy" | "satin" | "matte" | "textured" | "raw",
    "roughnessEstimate": number (0-1),
    "metalnessEstimate": number (0-1)
  },
  "partTextures": {
    "top": { texture object for the top surface/tabletop - often wood with specific grain },
    "legs": { texture object for legs/frame - often metal with specific finish },
    "body": { texture object for main body/cabinet },
    "seat": { texture for seat cushion - fabric/leather },
    "back": { texture for backrest },
    "arms": { texture for armrests },
    "drawers": { texture for drawer fronts },
    "doors": { texture for door panels },
    "shelves": { texture for shelf surfaces },
    "cushion": { texture for cushions/mattresses },
    "accent": { texture for accent/trim parts }
  }
}

IMPORTANT: For partTextures, only include parts that are actually present in the furniture. Each part texture object has the same schema as the main "texture" object. Different parts often have very different materials - e.g., a desk may have a wood-grain top (horizontal grain, satin finish) but powder-coated metal legs (matte finish). Analyze each visible part separately.

Be precise about colors - extract the actual colors from the image. For proportions, estimate carefully from the image perspective. For texture, carefully observe grain direction, surface sheen, and material finish quality per part.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this furniture product image. Product name: "${product_name || 'Unknown'}". Extract all 3D modeling parameters as JSON.`,
              },
              {
                type: "image_url",
                image_url: { url: image_url },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_furniture_params",
              description: "Extract 3D modeling parameters from a furniture image",
              parameters: {
                type: "object",
                properties: {
                  furnitureType: { type: "string", enum: ["desk", "chair", "storage", "shelf", "sofa", "lab", "dining", "roundtable", "blackboard", "bunkbed", "pet", "generic"] },
                  shape: { type: "string", enum: ["rectangular", "round", "L-shaped", "curved", "irregular"] },
                  topShape: { type: "string", enum: ["rectangular", "round", "oval", "irregular"] },
                  legStyle: { type: "string", enum: ["4-legs", "T-frame", "pedestal", "sled", "star-base", "panel", "trestle", "none"] },
                  legCount: { type: "number" },
                  hasArmrest: { type: "boolean" },
                  hasBackrest: { type: "boolean" },
                  hasDrawer: { type: "boolean" },
                  drawerCount: { type: "number" },
                  hasDoor: { type: "boolean" },
                  doorCount: { type: "number" },
                  hasShelf: { type: "boolean" },
                  shelfCount: { type: "number" },
                  hasCushion: { type: "boolean" },
                  primaryMaterial: { type: "string", enum: ["wood", "metal", "fabric", "plastic", "glass", "leather"] },
                  secondaryMaterial: { type: "string", enum: ["wood", "metal", "fabric", "plastic", "glass", "none"] },
                  primaryColor: { type: "string" },
                  secondaryColor: { type: "string" },
                  accentColor: { type: "string" },
                  topThickness: { type: "number" },
                  legThickness: { type: "number" },
                  proportions: {
                    type: "object",
                    properties: {
                      widthToDepthRatio: { type: "number" },
                      heightToWidthRatio: { type: "number" },
                      seatHeightRatio: { type: "number" },
                    },
                    required: ["widthToDepthRatio", "heightToWidthRatio"],
                  },
                  details: { type: "array", items: { type: "string" } },
                  texture: {
                    type: "object",
                    properties: {
                      woodGrain: {
                        type: "object",
                        properties: {
                          direction: { type: "string", enum: ["horizontal", "vertical", "diagonal", "radial"] },
                          intensity: { type: "string", enum: ["subtle", "moderate", "pronounced"] },
                          knotFrequency: { type: "string", enum: ["none", "few", "many"] },
                          grainColor: { type: "string" },
                        },
                      },
                      fabricPattern: {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["plain", "twill", "knit", "velvet", "leather-grain", "mesh", "woven"] },
                          weaveScale: { type: "number" },
                          patternColor: { type: "string" },
                        },
                      },
                      metalFinish: {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["brushed", "polished", "powder-coated", "anodized", "chrome", "matte"] },
                          brushDirection: { type: "string", enum: ["horizontal", "vertical", "circular"] },
                        },
                      },
                      surfaceFinish: { type: "string", enum: ["glossy", "satin", "matte", "textured", "raw"] },
                      roughnessEstimate: { type: "number" },
                      metalnessEstimate: { type: "number" },
                    },
                    required: ["surfaceFinish", "roughnessEstimate", "metalnessEstimate"],
                  },
                  partTextures: {
                    type: "object",
                    description: "Per-part texture overrides. Only include parts present in the furniture.",
                    properties: {
                      top: { $ref: "#/properties/texture" },
                      legs: { $ref: "#/properties/texture" },
                      body: { $ref: "#/properties/texture" },
                      seat: { $ref: "#/properties/texture" },
                      back: { $ref: "#/properties/texture" },
                      arms: { $ref: "#/properties/texture" },
                      drawers: { $ref: "#/properties/texture" },
                      doors: { $ref: "#/properties/texture" },
                      shelves: { $ref: "#/properties/texture" },
                      cushion: { $ref: "#/properties/texture" },
                      accent: { $ref: "#/properties/texture" },
                    },
                  },
                },
                required: [
                  "furnitureType", "shape", "legStyle", "legCount",
                  "primaryMaterial", "primaryColor", "secondaryColor",
                  "topThickness", "legThickness", "proportions", "details", "texture"
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_furniture_params" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    
    let analysis: Record<string, unknown> = {};
    
    // Extract from tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        analysis = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }
    
    // Fallback: try to extract JSON from content
    if (Object.keys(analysis).length === 0) {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
        } catch {
          console.error("Failed to parse JSON from content");
        }
      }
    }

    if (Object.keys(analysis).length === 0) {
      return new Response(JSON.stringify({ error: "Failed to analyze image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache the result
    await supabase.from("furniture_analysis_cache").upsert(
      {
        product_id,
        image_url,
        analysis,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id" }
    );

    return new Response(JSON.stringify({ analysis, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-furniture error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
