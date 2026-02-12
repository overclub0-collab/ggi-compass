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

      // Build tree: only return top-level categories
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

export const usePlannerProducts = (categoryId: string | null) => {
  return useQuery({
    queryKey: ['planner-products', categoryId],
    queryFn: async (): Promise<FurnitureItem[]> => {
      if (!categoryId) return [];

      // Get this category and its children (slugs + names for matching)
      const { data: categories } = await supabase
        .from('categories')
        .select('id, slug, name')
        .or(`id.eq.${categoryId},parent_id.eq.${categoryId}`);

      if (!categories || categories.length === 0) return [];

      const catSlugs = categories.map(c => c.slug);
      const catNames = categories.map(c => c.name);
      const catIds = categories.map(c => c.id);

      // Products may use UUID category, text category name, or main_category/subcategory slugs
      // Build an OR filter to match all possible patterns
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

      // Also try matching by Korean category name text (some products use '교육가구' etc.)
      const { data: textMatched } = await supabase
        .from('products')
        .select('id, title, slug, price, thumbnail_url, category, main_category, subcategory, specs')
        .eq('is_active', true)
        .in('category', catNames)
        .order('display_order');

      // Merge and deduplicate
      const allProducts = [...(products || [])];
      const existingIds = new Set(allProducts.map(p => p.id));
      (textMatched || []).forEach(p => {
        if (!existingIds.has(p.id)) allProducts.push(p);
      });

      return allProducts.map(p => {
        let width = 800;
        let height = 600;
        let depth = 400;

        if (p.specs && typeof p.specs === 'string') {
          // Try parsing "W×D×H mm" format (e.g. "1400×800×730mm", "650×450×720mm")
          const dimMatch = p.specs.match(/(\d+)\s*[×xX*]\s*(\d+)\s*[×xX*]\s*(\d+)/);
          if (dimMatch) {
            width = parseInt(dimMatch[1]) || 800;
            height = parseInt(dimMatch[2]) || 600; // depth in top-view
            depth = parseInt(dimMatch[3]) || 400;  // vertical height
          } else {
            // Try JSON format as fallback
            try {
              const specs = JSON.parse(p.specs);
              if (specs.width) width = parseInt(specs.width) || 800;
              if (specs.height) height = parseInt(specs.height) || 600;
              if (specs.depth) depth = parseInt(specs.depth) || 400;
              if (specs['가로']) width = parseInt(specs['가로']) || 800;
              if (specs['세로']) height = parseInt(specs['세로']) || 600;
              if (specs['높이']) depth = parseInt(specs['높이']) || 400;
            } catch {
              // ignore parse errors
            }
          }
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
