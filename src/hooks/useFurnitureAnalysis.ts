import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  details: string[];
}

// Batch analysis store to avoid duplicate calls
const analysisCache = new Map<string, FurnitureAnalysis | null>();
const pendingRequests = new Map<string, Promise<FurnitureAnalysis | null>>();

async function fetchAnalysis(productId: string, imageUrl: string, productName: string): Promise<FurnitureAnalysis | null> {
  // Check in-memory cache
  if (analysisCache.has(productId)) {
    return analysisCache.get(productId) || null;
  }

  // Deduplicate concurrent requests
  if (pendingRequests.has(productId)) {
    return pendingRequests.get(productId)!;
  }

  const promise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-furniture', {
        body: { product_id: productId, image_url: imageUrl, product_name: productName },
      });

      if (error) {
        console.error('Furniture analysis error:', error);
        return null;
      }

      const analysis = data?.analysis as FurnitureAnalysis | null;
      analysisCache.set(productId, analysis);
      return analysis;
    } catch (e) {
      console.error('Furniture analysis fetch failed:', e);
      return null;
    } finally {
      pendingRequests.delete(productId);
    }
  })();

  pendingRequests.set(productId, promise);
  return promise;
}

export function useFurnitureAnalysis(productId: string, imageUrl: string, productName: string) {
  return useQuery({
    queryKey: ['furniture-analysis', productId],
    queryFn: () => fetchAnalysis(productId, imageUrl, productName),
    enabled: !!productId && !!imageUrl,
    staleTime: Infinity, // Never refetch — cached permanently
    gcTime: Infinity,
    retry: 1,
  });
}

// Prefetch multiple analyses in batch
export async function prefetchAnalyses(
  products: Array<{ id: string; thumbnail: string; name: string }>
) {
  const toFetch = products.filter(
    (p) => p.thumbnail && !analysisCache.has(p.id) && !pendingRequests.has(p.id)
  );

  // Limit concurrent requests to avoid rate limiting
  const batchSize = 3;
  for (let i = 0; i < toFetch.length; i += batchSize) {
    const batch = toFetch.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map((p) => fetchAnalysis(p.id, p.thumbnail, p.name))
    );
    // Small delay between batches
    if (i + batchSize < toFetch.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

export function getCachedAnalysis(productId: string): FurnitureAnalysis | null {
  return analysisCache.get(productId) || null;
}
