import { supabase } from '@/integrations/supabase/client';

interface CategoryMapping {
  name: string;
  slug: string;
  parent_id: string | null;
}

let cachedCategories: CategoryMapping[] | null = null;

/**
 * Fetch all categories and build name/slug mappings
 */
export const fetchCategoryMappings = async (): Promise<CategoryMapping[]> => {
  if (cachedCategories) return cachedCategories;

  const { data, error } = await supabase
    .from('categories')
    .select('name, slug, parent_id')
    .eq('is_active', true);

  if (error || !data) {
    console.warn('Failed to fetch categories for slug resolution:', error);
    return [];
  }

  cachedCategories = data;
  return data;
};

/**
 * Clear cached categories (call when categories change)
 */
export const clearCategoryCache = () => {
  cachedCategories = null;
};

/**
 * Resolve a category value to its slug.
 * If the value is already a valid slug, return it as-is.
 * If it's a Korean name, find the matching slug.
 */
export const resolveCategorySlug = (
  value: string | null | undefined,
  categories: CategoryMapping[],
  parentOnly: boolean = false
): string | null => {
  if (!value || !value.trim()) return null;

  const trimmed = value.trim();

  // Filter by parent/child level
  const filtered = parentOnly
    ? categories.filter(c => !c.parent_id)
    : categories.filter(c => !!c.parent_id);

  // 1. Exact slug match within correct level
  const bySlug = filtered.find(c => c.slug === trimmed);
  if (bySlug) return bySlug.slug;

  // 2. Exact name match within correct level (case-insensitive)
  const byName = filtered.find(
    c => c.name.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (byName) return byName.slug;

  // 3. Partial name match (contains) within correct level
  const byPartialName = filtered.find(
    c => c.name.trim().replace(/\s+/g, '').toLowerCase() === trimmed.replace(/\s+/g, '').toLowerCase()
  );
  if (byPartialName) return byPartialName.slug;

  // 4. Cross-level slug match (warn but allow as last resort)
  const anySlugMatch = categories.find(c => c.slug === trimmed);
  if (anySlugMatch) {
    console.warn(`Category "${trimmed}" matched cross-level (expected ${parentOnly ? 'parent' : 'child'}, found ${anySlugMatch.parent_id ? 'child' : 'parent'})`);
    return anySlugMatch.slug;
  }

  // 5. Cross-level name match
  const anyNameMatch = categories.find(
    c => c.name.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (anyNameMatch) {
    console.warn(`Category name "${trimmed}" matched cross-level`);
    return anyNameMatch.slug;
  }

  console.warn(`Category "${trimmed}" not found in any category. Using as-is.`);
  return trimmed;
};

/**
 * Resolve both main_category and subcategory from raw values.
 * Accepts either slug or Korean name.
 */
export const resolveProductCategories = (
  mainCategoryRaw: string | null | undefined,
  subcategoryRaw: string | null | undefined,
  categories: CategoryMapping[]
): { main_category: string | null; subcategory: string | null } => {
  const main_category = resolveCategorySlug(mainCategoryRaw, categories, true);
  const subcategory = resolveCategorySlug(subcategoryRaw, categories, false);
  return { main_category, subcategory };
};
