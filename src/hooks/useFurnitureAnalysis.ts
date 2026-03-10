import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TextureAnalysis {
  woodGrain?: {
    direction: 'horizontal' | 'vertical' | 'diagonal' | 'radial';
    intensity: 'subtle' | 'moderate' | 'pronounced';
    knotFrequency: 'none' | 'few' | 'many';
    grainColor: string;
  };
  fabricPattern?: {
    type: 'plain' | 'twill' | 'knit' | 'velvet' | 'leather-grain' | 'mesh' | 'woven';
    weaveScale: number;
    patternColor?: string;
  };
  metalFinish?: {
    type: 'brushed' | 'polished' | 'powder-coated' | 'anodized' | 'chrome' | 'matte';
    brushDirection?: 'horizontal' | 'vertical' | 'circular';
  };
  surfaceFinish: 'glossy' | 'satin' | 'matte' | 'textured' | 'raw';
  roughnessEstimate: number;
  metalnessEstimate: number;
}

export interface PartTextures {
  top?: TextureAnalysis;
  legs?: TextureAnalysis;
  body?: TextureAnalysis;
  seat?: TextureAnalysis;
  back?: TextureAnalysis;
  arms?: TextureAnalysis;
  drawers?: TextureAnalysis;
  doors?: TextureAnalysis;
  shelves?: TextureAnalysis;
  cushion?: TextureAnalysis;
  accent?: TextureAnalysis;
}

export interface SectionLayout {
  layout: 'single' | 'top-bottom' | 'left-center-right' | 'grid' | 'complex';
  bottomRatio?: number;
  middleRatio?: number;
  topRatio?: number;
  leftSideRatio?: number;
  columns?: number;
  rows?: number;
  compartmentGrid?: { cols: number; rows: number };
  hasOpenFront?: boolean;
  hasBoardArea?: boolean;
  boardPosition?: 'center' | 'top' | 'back';
}

export interface FurnitureAnalysis {
  furnitureType: string;
  shape: string;
  topShape?: string;
  legStyle: string;
  legCount: number;
  hasArmrest?: boolean;
  hasBackrest?: boolean;
  hasDrawer?: boolean;
  drawerCount?: number;
  hasDoor?: boolean;
  doorCount?: number;
  hasShelf?: boolean;
  shelfCount?: number;
  hasCushion?: boolean;
  primaryMaterial: string;
  secondaryMaterial?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  topThickness: number;
  legThickness: number;
  proportions: {
    widthToDepthRatio: number;
    heightToWidthRatio: number;
    seatHeightRatio?: number;
  };
  sections?: SectionLayout;
  details: string[];
  texture?: TextureAnalysis;
  partTextures?: PartTextures;
}

// In-memory cache
const analysisCache = new Map<string, FurnitureAnalysis | null>();

/**
 * Fetch analysis directly from the database cache table.
 * No AI calls — only reads manually or previously saved data.
 */
async function fetchAnalysisFromDB(productId: string): Promise<FurnitureAnalysis | null> {
  if (analysisCache.has(productId)) {
    return analysisCache.get(productId) || null;
  }

  try {
    const { data, error } = await supabase
      .from('furniture_analysis_cache')
      .select('analysis')
      .eq('product_id', productId)
      .maybeSingle();

    if (error) {
      console.error('DB analysis fetch error:', error);
      return null;
    }

    if (!data?.analysis || typeof data.analysis !== 'object' || Object.keys(data.analysis as object).length === 0) {
      analysisCache.set(productId, null);
      return null;
    }

    const analysis = data.analysis as unknown as FurnitureAnalysis;
    analysisCache.set(productId, analysis);
    return analysis;
  } catch (e) {
    console.error('Furniture analysis DB fetch failed:', e);
    return null;
  }
}

export function useFurnitureAnalysis(productId: string, imageUrl: string, productName: string) {
  return useQuery({
    queryKey: ['furniture-analysis', productId],
    queryFn: () => fetchAnalysisFromDB(productId),
    enabled: !!productId,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
}

/**
 * Prefetch multiple analyses from DB in batch (no AI calls).
 */
export async function prefetchAnalyses(
  products: Array<{ id: string; thumbnail: string; name: string }>
) {
  const toFetch = products.filter(
    (p) => !analysisCache.has(p.id)
  );

  if (toFetch.length === 0) return;

  try {
    const { data, error } = await supabase
      .from('furniture_analysis_cache')
      .select('product_id, analysis')
      .in('product_id', toFetch.map(p => p.id));

    if (error) {
      console.error('Batch analysis fetch error:', error);
      return;
    }

    // Cache all results
    const foundIds = new Set<string>();
    for (const row of data || []) {
      const analysis = row.analysis && typeof row.analysis === 'object' && Object.keys(row.analysis as object).length > 0
        ? (row.analysis as unknown as FurnitureAnalysis)
        : null;
      analysisCache.set(row.product_id, analysis);
      foundIds.add(row.product_id);
    }

    // Mark unfound products as null
    for (const p of toFetch) {
      if (!foundIds.has(p.id)) {
        analysisCache.set(p.id, null);
      }
    }
  } catch (e) {
    console.error('Batch analysis fetch failed:', e);
  }
}

export function getCachedAnalysis(productId: string): FurnitureAnalysis | null {
  return analysisCache.get(productId) || null;
}

/** Clear in-memory cache for a product (e.g., after admin saves new analysis) */
export function invalidateAnalysisCache(productId: string) {
  analysisCache.delete(productId);
}
