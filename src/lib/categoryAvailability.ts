interface CategoryStatus {
  id: string;
  slug: string;
  parent_id: string | null;
  is_active?: boolean | null;
}

export function isCategoryRouteAvailable(categories: CategoryStatus[], main?: string, sub?: string): boolean {
  if (!main || main === 'all') return true;
  const parent = categories.find(c => c.slug === main && !c.parent_id && c.is_active === true);
  if (!parent) return false;
  return !sub || categories.some(c => c.slug === sub && c.parent_id === parent.id && c.is_active === true);
}