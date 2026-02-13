import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FurnitureItem } from '@/types/planner';

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children: CategoryNode[];
}

export const usePlannerCategories = () => {
  return useQuery({
    queryKey: ['planner-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      const topLevel = (data || []).filter(c => !c.parent_id);
      const tree: CategoryNode[] = topLevel.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: null,
        children: (data || [])
          .filter(c => c.parent_id === cat.id)
          .map(sub => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            parentId: sub.parent_id,
            children: [],
          })),
      }));

      return tree;
    },
  });
};

/**
 * Parse dimension string like "650×600×1980mm", "1400*800*730", "1400x800x730mm" etc.
 * Returns [width, depth, height] in mm or null if parsing fails.
 */
function parseDimensions(specs: string): [number, number, number] | null {
  if (!specs || typeof specs !== 'string') return null;

  // Remove all whitespace first
  const cleaned = specs.replace(/\s+/g, '');

  // Try multiple separator patterns explicitly
  // Pattern 1: digits separated by ×, x, X, *, by 
  const patterns = [
    /(\d{2,5})[×xX*✕](\d{2,5})[×xX*✕](\d{2,5})/,
    /(\d{2,5})\D+(\d{2,5})\D+(\d{2,5})/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const w = parseInt(match[1], 10);
      const d = parseInt(match[2], 10);
      const h = parseInt(match[3], 10);
      if (w > 0 && d > 0 && h > 0) {
        return [w, d, h];
      }
    }
  }

  // Try on original (non-cleaned) string too
  for (const pattern of patterns) {
    const match = specs.match(pattern);
    if (match) {
      const w = parseInt(match[1], 10);
      const d = parseInt(match[2], 10);
      const h = parseInt(match[3], 10);
      if (w > 0 && d > 0 && h > 0) {
        return [w, d, h];
      }
    }
  }

  // Fallback: extract all number sequences of 2-5 digits
  const allNums = specs.match(/\d{2,5}/g);
  if (allNums && allNums.length >= 3) {
    const w = parseInt(allNums[0], 10);
    const d = parseInt(allNums[1], 10);
    const h = parseInt(allNums[2], 10);
    if (w > 0 && d > 0 && h > 0) {
      return [w, d, h];
    }
  }

  // Try JSON format as last resort
  try {
    const obj = JSON.parse(specs);
    const w = parseInt(obj.width || obj['가로'] || '0', 10);
    const d = parseInt(obj.depth || obj['세로'] || '0', 10);
    const h = parseInt(obj.height || obj['높이'] || '0', 10);
    if (w > 0 && d > 0 && h > 0) return [w, d, h];
  } catch {
    // not JSON
  }

  return null;
}

export const usePlannerProducts = (categoryId: string | null) => {
  return useQuery({
    queryKey: ['planner-products', categoryId],
    queryFn: async (): Promise<FurnitureItem[]> => {
      if (!categoryId) return [];

      const { data: categories } = await supabase
        .from('categories')
        .select('id, slug, name')
        .or(`id.eq.${categoryId},parent_id.eq.${categoryId}`);

      if (!categories || categories.length === 0) return [];

      const catSlugs = categories.map(c => c.slug);
      const catNames = categories.map(c => c.name);
      const catIds = categories.map(c => c.id);

      const filters = [
        ...catIds.map(id => `category.eq.${id}`),
        ...catSlugs.map(s => `main_category.eq.${s}`),
        ...catSlugs.map(s => `subcategory.eq.${s}`),
      ];

      const { data: products, error } = await supabase
        .from('products')
        .select('id, title, slug, price, thumbnail_url, category, main_category, subcategory, specs')
        .eq('is_active', true)
        .or(filters.join(','))
        .order('display_order');

      if (error) throw error;

      const { data: textMatched } = await supabase
        .from('products')
        .select('id, title, slug, price, thumbnail_url, category, main_category, subcategory, specs')
        .eq('is_active', true)
        .in('category', catNames)
        .order('display_order');

      const allProducts = [...(products || [])];
      const existingIds = new Set(allProducts.map(p => p.id));
      (textMatched || []).forEach(p => {
        if (!existingIds.has(p.id)) allProducts.push(p);
      });

      return allProducts.map(p => {
        let width = 800;
        let height = 600;
        let depth = 750;

        const dims = parseDimensions(p.specs || '');
        if (dims) {
          width = dims[0];
          height = dims[1]; // depth in top-view (2D)
          depth = dims[2];  // vertical height (3D)
          console.log(`[Planner] ${p.title}: ${width}×${height}×${depth}mm from specs "${p.specs}"`);
        } else if (p.specs) {
          console.warn(`[Planner] Could not parse specs for "${p.title}": "${p.specs}"`);
        }

        const priceNum = p.price ? parseInt(p.price.replace(/[^0-9]/g, '')) || 0 : 0;

        return {
          id: p.id,
          name: p.title,
          category: categoryId,
          width,
          height,
          depth,
          price: priceNum,
          thumbnail: p.thumbnail_url || '',
          color: getCategoryColor(p.main_category || ''),
        };
      });
    },
    enabled: !!categoryId,
  });
};

function getCategoryColor(mainCategory: string): string {
  const colors: Record<string, string> = {
    'educational': 'hsl(45, 40%, 85%)',
    'office': 'hsl(210, 20%, 80%)',
    'chairs': 'hsl(0, 0%, 30%)',
    'dining-table': 'hsl(30, 40%, 70%)',
    'lab-bench': 'hsl(180, 15%, 75%)',
    'military': 'hsl(120, 15%, 65%)',
  };
  return colors[mainCategory] || 'hsl(210, 15%, 80%)';
}
