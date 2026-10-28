import { describe, it, expect } from 'vitest';
import { isCategoryRouteAvailable } from '../lib/categoryAvailability';

const categories = [
  { id: 'office', slug: 'office', parent_id: null, is_active: true },
  { id: 'desk', slug: 'desk', parent_id: 'office', is_active: true },
  { id: 'empty', slug: 'empty', parent_id: 'office', is_active: false },
  { id: 'pet', slug: 'pet', parent_id: null, is_active: false },
  { id: 'house', slug: 'house', parent_id: 'pet', is_active: true },
];

describe('category activation', () => {
  it('blocks disabled categories even if a URL is entered directly', () => {
    expect(isCategoryRouteAvailable(categories, 'office', 'empty')).toBe(false);
  });
  it('honors explicit admin activation of an empty category', () => {
    expect(isCategoryRouteAvailable(categories.map(c => c.id === 'empty' ? { ...c, is_active: true } : c), 'office', 'empty')).toBe(true);
  });
  it('blocks children of a disabled main category', () => {
    expect(isCategoryRouteAvailable(categories, 'pet', 'house')).toBe(false);
  });
  it('allows active categories and the all-products page', () => {
    expect(isCategoryRouteAvailable(categories, 'office', 'desk')).toBe(true);
    expect(isCategoryRouteAvailable([], 'all')).toBe(true);
  });
});