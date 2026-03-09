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
    const systemPrompt = `You are a furniture 3D modeling expert with deep knowledge of Korean educational/office/institutional furniture. Your task is to analyze a product photo and extract PRECISE structural parameters for generating an accurate Three.js procedural 3D model.

CRITICAL INSTRUCTIONS:
1. Study the image CAREFULLY. Count every compartment, shelf, door, drawer precisely.
2. Estimate proportions from the image perspective — the ratio of each structural section's height relative to total height.
3. Identify the EXACT structural layout: how the furniture is divided into sections (top/middle/bottom, left/center/right).
4. For colors, extract the ACTUAL hex colors visible in the image, not generic approximations.
5. Pay attention to materials: Korean school furniture often uses melamine-coated particleboard, steel frames, or HPL surfaces.

Return a JSON object with these fields:
{
  "furnitureType": one of ["desk", "chair", "storage", "shelf", "sofa", "lab", "dining", "roundtable", "blackboard", "bunkbed", "pet", "podium", "partition", "generic"],
  "shape": "rectangular" | "round" | "L-shaped" | "curved" | "irregular",
  "topShape": "rectangular" | "round" | "oval" | "irregular",
  "legStyle": "4-legs" | "T-frame" | "pedestal" | "sled" | "star-base" | "panel" | "trestle" | "none",
  "legCount": number,
  "hasArmrest": boolean,
  "hasBackrest": boolean,
  "hasDrawer": boolean,
  "drawerCount": number (exact count from image),
  "hasDoor": boolean,
  "doorCount": number (exact count from image),
  "hasShelf": boolean,
  "shelfCount": number (exact count of visible horizontal shelves),
  "hasCushion": boolean,
  "primaryMaterial": "wood" | "metal" | "fabric" | "plastic" | "glass" | "leather" | "melamine" | "hpl",
  "secondaryMaterial": "wood" | "metal" | "fabric" | "plastic" | "glass" | "none",
  "primaryColor": "#hexcolor" (EXACT color from image),
  "secondaryColor": "#hexcolor",
  "accentColor": "#hexcolor",
  "topThickness": number (ratio 0.01-0.1 relative to height),
  "legThickness": number (ratio 0.02-0.1 relative to width),
  "proportions": {
    "widthToDepthRatio": number,
    "heightToWidthRatio": number,
    "seatHeightRatio": number (for chairs)
  },
  "sections": {
    "layout": "single" | "top-bottom" | "left-center-right" | "grid" | "complex",
    "bottomRatio": number (0-1, height ratio of bottom section),
    "middleRatio": number (0-1, height ratio of middle section),
    "topRatio": number (0-1, height ratio of top section),
    "leftSideRatio": number (0-1, width ratio of side sections),
    "columns": number (number of vertical divisions in main area),
    "rows": number (number of horizontal divisions/shelves),
    "compartmentGrid": { "cols": number, "rows": number } (for lockers/cubby storage),
    "hasOpenFront": boolean,
    "hasBoardArea": boolean (whiteboard/blackboard in center),
    "boardPosition": "center" | "top" | "back" (where the board is)
  },
  "details": string[] (PRECISE list: "crossbar", "curved-back", "tapered-legs", "rounded-edges", "metal-frame", "wood-grain", "upholstered", "ventilation-holes", "number-labels", "handle-recessed", "handle-knob", "adjustable-feet", "casters", "wire-management", "keyboard-tray", "monitor-arm", "glass-top", "sliding-door", "folding", "stackable", "wall-mounted", "open-back", "closed-back", "edge-banding", "modesty-panel", "cable-tray", "pegboard", "hooks", "marker-tray", "chalk-tray", "upper-shelf", "compartments", "lock", "sink", "basin", "faucet"),
  "texture": {
    "woodGrain": { "direction": "horizontal"|"vertical"|"diagonal"|"radial", "intensity": "subtle"|"moderate"|"pronounced", "knotFrequency": "none"|"few"|"many", "grainColor": "#hex" },
    "fabricPattern": { "type": "plain"|"twill"|"knit"|"velvet"|"leather-grain"|"mesh"|"woven", "weaveScale": number, "patternColor": "#hex" },
    "metalFinish": { "type": "brushed"|"polished"|"powder-coated"|"anodized"|"chrome"|"matte", "brushDirection": "horizontal"|"vertical"|"circular" },
    "surfaceFinish": "glossy" | "satin" | "matte" | "textured" | "raw",
    "roughnessEstimate": number (0-1),
    "metalnessEstimate": number (0-1)
  },
  "partTextures": {
    "top": { ... same as texture },
    "legs": { ... },
    "body": { ... },
    "seat": { ... },
    "back": { ... },
    "arms": { ... },
    "drawers": { ... },
    "doors": { ... },
    "shelves": { ... },
    "cushion": { ... },
    "accent": { ... }
  }
}

EXAMPLES of precise analysis:
- 칠판보조장 (Blackboard Cabinet): sections.layout="left-center-right", sections.hasBoardArea=true, sections.bottomRatio=0.3, sections.leftSideRatio=0.12, compartmentGrid for upper shelves
- 사물함 (Locker): sections.layout="grid", sections.compartmentGrid={cols:4,rows:5}, hasDoor=true, doorCount=20
- 실험대 (Lab Bench): details includes "sink","faucet", sections.layout="single"
- 교탁/강연대 (Podium): furnitureType="podium", sections.layout="complex"

IMPORTANT: Count EXACTLY from the image. If a locker has 4 columns × 5 rows = 20 compartments, report doorCount=20, compartmentGrid={cols:4,rows:5}. Do NOT guess — analyze the image precisely.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this furniture product image with EXTREME PRECISION. Product name: "${product_name || 'Unknown'}". 
                
Study the image carefully and extract:
1. Exact number of compartments, doors, shelves, drawers
2. Precise color hex codes from the image
3. Structural section proportions (what percentage of height is bottom cabinet vs board area vs upper shelves)
4. Material identification (melamine, metal, HPL, etc.)
5. All visible structural details

Return the complete analysis JSON.`,
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
              description: "Extract precise 3D modeling parameters from a furniture image for Three.js procedural generation",
              parameters: {
                type: "object",
                properties: {
                  furnitureType: { type: "string", enum: ["desk", "chair", "storage", "shelf", "sofa", "lab", "dining", "roundtable", "blackboard", "bunkbed", "pet", "podium", "partition", "generic"] },
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
                  primaryMaterial: { type: "string", enum: ["wood", "metal", "fabric", "plastic", "glass", "leather", "melamine", "hpl"] },
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
                  sections: {
                    type: "object",
                    description: "Structural layout of the furniture — how it is divided into sections",
                    properties: {
                      layout: { type: "string", enum: ["single", "top-bottom", "left-center-right", "grid", "complex"] },
                      bottomRatio: { type: "number", description: "Height ratio (0-1) of the bottom section" },
                      middleRatio: { type: "number", description: "Height ratio (0-1) of the middle section" },
                      topRatio: { type: "number", description: "Height ratio (0-1) of the top section" },
                      leftSideRatio: { type: "number", description: "Width ratio (0-1) of each side section" },
                      columns: { type: "number", description: "Number of vertical column divisions" },
                      rows: { type: "number", description: "Number of horizontal row divisions" },
                      compartmentGrid: {
                        type: "object",
                        properties: {
                          cols: { type: "number" },
                          rows: { type: "number" },
                        },
                      },
                      hasOpenFront: { type: "boolean" },
                      hasBoardArea: { type: "boolean" },
                      boardPosition: { type: "string", enum: ["center", "top", "back"] },
                    },
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
                    description: "Per-part texture overrides. Only include parts actually present.",
                    properties: Object.fromEntries(
                      ["top", "legs", "body", "seat", "back", "arms", "drawers", "doors", "shelves", "cushion", "accent"].map(part => [
                        part,
                        {
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
                      ])
                    ),
                  },
                },
                required: [
                  "furnitureType", "shape", "legStyle", "legCount",
                  "primaryMaterial", "primaryColor", "secondaryColor",
                  "topThickness", "legThickness", "proportions", "details", "texture", "sections"
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
