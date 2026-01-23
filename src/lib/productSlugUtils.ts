import { supabase } from "@/integrations/supabase/client";

/**
 * Generate a random 4-character alphanumeric suffix (lowercase)
 */
export const generateRandomSuffix = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Create a URL-safe slug from Korean/English text
 */
export const createSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    // Keep alphanumeric, Korean, underscore, and hyphens
    .replace(/[^\w\uAC00-\uD7A3-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
};

/**
 * Remove trailing "-xxxx" random suffix if present.
 */
export const stripRandomSuffix = (slug: string): string => {
  return slug.replace(/-[a-z0-9]{4}$/i, "");
};

/**
 * Fetch ALL existing product slugs.
 *
 * Important: backend queries often default to 1000-row limits.
 * We page through results to avoid missing slugs in large datasets.
 */
export const fetchAllExistingProductSlugs = async (): Promise<Set<string>> => {
  const slugs = new Set<string>();
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("slug")
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Error fetching existing slugs:", error);
      return slugs;
    }

    if (!data || data.length === 0) break;
    for (const row of data) {
      if (row?.slug) slugs.add(row.slug);
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return slugs;
};

/**
 * Generate a unique slug by appending random suffix if needed.
 */
export const generateUniqueSlug = (
  baseSlug: string,
  existingSlugs: Set<string>,
  batchSlugs: Set<string>
): string => {
  let slug = baseSlug;
  let attempts = 0;
  const maxAttempts = 20;

  while ((existingSlugs.has(slug) || batchSlugs.has(slug)) && attempts < maxAttempts) {
    const suffix = generateRandomSuffix();
    slug = `${baseSlug}-${suffix}`.substring(0, 100);
    attempts++;
  }

  if (existingSlugs.has(slug) || batchSlugs.has(slug)) {
    slug = `${baseSlug}-${Date.now()}`.substring(0, 100);
  }

  return slug;
};
