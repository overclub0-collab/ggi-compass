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

★★★ LEG STYLE DETECTION — CRITICAL ★★★
Pay EXTREME attention to the leg structure. This is the most important visual differentiator:
- "4-legs": Four individual straight legs (square or round cross-section)
- "T-frame": Two T-shaped side supports (vertical post + horizontal foot bar)
- "panel": Solid side panels (thick board-like sides, common in wooden desks)
- "trestle": A-frame or trestle supports (angled/splayed legs with crossbar)
- "sled": U-shaped runners connecting front and back (like a sled/sleigh base)
- "pedestal": Single central column
- "star-base": 5-spoke star base with casters (office chairs)
- "none": No legs (wall-mounted or sits directly on floor)

★★★ MATERIAL DETECTION FOR LEGS ★★★
- If legs are thin round tubes (often chrome/silver/black), set secondaryMaterial="metal"
- If legs are thick solid wood (often matching the tabletop color), set secondaryMaterial="wood"  
- If legs are flat steel plates or thick steel tubes, set secondaryMaterial="metal"
- Wooden legs are often tapered (wider at top, narrower at bottom) — add "tapered-legs" to details
- Round cross-section wood legs — add "round-legs" to details

★★★ OPEN vs CLOSED STORAGE — CRITICAL ★★★
- If the product has NO doors and shelves are visible/exposed, set hasDoor=false AND sections.hasOpenFront=true
- 오픈형 (open-type) shelving: hasDoor=false, hasOpenFront=true
- Products with visible items inside = open front
- Only set hasDoor=true if you can clearly see door panels with handles/knobs

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
  "details": string[] (PRECISE list: "crossbar", "curved-back", "tapered-legs", "round-legs", "cylindrical", "rounded-edges", "metal-frame", "wood-grain", "upholstered", "ventilation-holes", "number-labels", "handle-recessed", "handle-knob", "adjustable-feet", "casters", "wire-management", "keyboard-tray", "monitor-arm", "glass-top", "sliding-door", "folding", "stackable", "wall-mounted", "open-back", "closed-back", "edge-banding", "modesty-panel", "cable-tray", "pegboard", "hooks", "marker-tray", "chalk-tray", "upper-shelf", "compartments", "lock", "sink", "basin", "faucet"),
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
- 철재다리 책상: legStyle="4-legs" or "T-frame", secondaryMaterial="metal", legs.metalFinish.type="powder-coated"
- 목재다리 책상: legStyle="4-legs", secondaryMaterial="wood", details=["tapered-legs" or "round-legs"]
- 오픈형 신발장: hasDoor=false, sections.hasOpenFront=true, furnitureType="storage"
- 도어형 사물함: hasDoor=true, sections.compartmentGrid={cols:N,rows:M}
- 실험대: details includes "sink","faucet", sections.layout="single"

★★★ 칠판보조장 (Blackboard Cabinet) — CRITICAL DIFFERENTIATION ★★★
These products vary DRAMATICALLY. Analyze the ACTUAL image carefully:
- Type A: Classic left-center-right with board — layout="left-center-right", hasBoardArea=true, leftSideRatio=width ratio of side columns
- Type B: Upper/Lower split — layout="top-bottom", hasBoardArea=false, bottomRatio=lower cab height ratio, topRatio=upper shelf height ratio. Lower has doors/drawers, upper has open shelves
- Type C: Full grid shelving — layout="grid", hasBoardArea=false, compartmentGrid={cols:N, rows:M}. No board, just open compartments
- Type D: Left-center-right WITHOUT board — layout="left-center-right", hasBoardArea=false, all sections are shelving
- CRITICAL: Set hasBoardArea=true ONLY if you see a WHITEBOARD or BLACKBOARD surface in the center. If it's all shelving/storage, set hasBoardArea=false
- Count exact drawer/door/shelf numbers from the image
- Set hasDrawer=true and drawerCount=N if you see pull-out drawers (with horizontal handles)
- Set sections.columns and sections.rows precisely for the visible compartment layout

IMPORTANT: Count EXACTLY from the image. If a locker has 4 columns × 5 rows = 20 compartments, report doorCount=20, compartmentGrid={cols:4,rows:5}. Do NOT guess — analyze the image precisely.
For leg style, look at the ACTUAL leg structure visible in the image, not assumptions.`;

    // Try multiple models with failover
    const modelsToTry = [
      "google/gemini-3-flash-preview",
      "google/gemini-2.5-flash-lite",
      "google/gemini-2.5-flash",
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000); // 50s timeout

    let response: Response | null = null;
    let lastStatus = 0;

    for (const model of modelsToTry) {
      console.log(`Trying model: ${model}`);
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this furniture product image with EXTREME PRECISION. Product name: "${product_name || 'Unknown'}". 

CRITICAL FOCUS AREAS:
1. LEG STYLE: Look carefully at the legs. Are they thin metal tubes? Thick wood posts? T-shaped frames? Sled runners? Panel sides? Describe the EXACT leg structure.
   - If "${product_name}" contains "철재" or "스틸": legs are metal (secondaryMaterial="metal")
   - If "${product_name}" contains "목재" or "원목": legs are wood (secondaryMaterial="wood") 
   - If "${product_name}" contains "오픈": hasDoor=false, hasOpenFront=true
2. DOORS vs OPEN: Is the front OPEN (shelves visible) or CLOSED (with door panels)? Set hasDoor accurately.
3. Exact number of compartments, doors, shelves, drawers
4. Precise color hex codes from the image
5. Structural section proportions
6. Material identification (melamine, metal, HPL, etc.)

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

    clearTimeout(timeout);

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
    if (e instanceof DOMException && e.name === 'AbortError') {
      console.error("analyze-furniture timeout");
      return new Response(
        JSON.stringify({ error: "Analysis timed out. Please try again." }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.error("analyze-furniture error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
