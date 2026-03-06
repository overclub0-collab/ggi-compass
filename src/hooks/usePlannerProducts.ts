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

function parseDimensions(specs: string): [number, number, number] | null {
  if (!specs || typeof specs !== 'string') return null;

  const cleaned = specs.replace(/\s+/g, '');

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
      if (w > 0 && d > 0 && h > 0) return [w, d, h];
    }
  }

  for (const pattern of patterns) {
    const match = specs.match(pattern);
    if (match) {
      const w = parseInt(match[1], 10);
      const d = parseInt(match[2], 10);
      const h = parseInt(match[3], 10);
      if (w > 0 && d > 0 && h > 0) return [w, d, h];
    }
  }

  const allNums = specs.match(/\d{2,5}/g);
  if (allNums && allNums.length >= 3) {
    const w = parseInt(allNums[0], 10);
    const d = parseInt(allNums[1], 10);
    const h = parseInt(allNums[2], 10);
    if (w > 0 && d > 0 && h > 0) return [w, d, h];
  }

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

      // Fetch the selected category and all its children (recursive one level)
      const { data: categories } = await supabase
        .from('categories')
        .select('id, slug, name, parent_id')
        .or(`id.eq.${categoryId},parent_id.eq.${categoryId}`);

      if (!categories || categories.length === 0) return [];

      const catSlugs = categories.map(c => c.slug);
      const catNames = categories.map(c => c.name);

      // Build comprehensive filter: match by slug in main_category OR subcategory, OR by name in category
      const slugFilters = [
        ...catSlugs.map(s => `main_category.eq.${s}`),
        ...catSlugs.map(s => `subcategory.eq.${s}`),
      ];

      // Query 1: Match by slug
      const { data: bySlug } = await supabase
        .from('products')
        .select('id, title, slug, price, thumbnail_url, category, main_category, subcategory, specs')
        .eq('is_active', true)
        .or(slugFilters.join(','))
        .order('display_order')
        .limit(500);

      // Query 2: Match by display name in legacy 'category' field
      const { data: byName } = await supabase
        .from('products')
        .select('id, title, slug, price, thumbnail_url, category, main_category, subcategory, specs')
        .eq('is_active', true)
        .in('category', catNames)
        .order('display_order')
        .limit(500);

      // Merge deduplicated
      const allProducts = [...(bySlug || [])];
      const existingIds = new Set(allProducts.map(p => p.id));
      (byName || []).forEach(p => {
        if (!existingIds.has(p.id)) {
          allProducts.push(p);
          existingIds.add(p.id);
        }
      });

      return allProducts.map(p => {
        let width = 800;
        let height = 600;
        let depth = 750;

        const dims = parseDimensions(p.specs || '');
        if (dims) {
          width = dims[0];
          height = dims[1];
          depth = dims[2];
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
