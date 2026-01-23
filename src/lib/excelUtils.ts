import { parseCSV, downloadCSV, validateFileSize, validateProduct, parseSpecs, MAX_CSV_ROWS } from './csvUtils';
import { supabase } from '@/integrations/supabase/client';

export interface ProductExportData {
  슬러그: string;
  품명: string;
  규격: string;
  조달식별번호: string;
  가격: string;
  제품설명: string;
  이미지URL: string;
  추가이미지1: string;
  추가이미지2: string;
  뱃지: string;
  특징: string;
  대분류: string;
  소분류: string;
  순서: number;
}

export interface ProductImportData {
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  images: string[];
  badges: string[];
  features: string[];
  specs: string | null;
  main_category: string | null;
  subcategory: string | null;
  display_order: number;
  procurement_id: string | null;
  price: string | null;
  is_active: boolean;
}

/**
 * Generate a random 4-character alphanumeric string
 */
const generateRandomSuffix = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Create a URL-safe slug from Korean text
 */
const createSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\uAC00-\uD7A3-]/g, '') // Keep alphanumeric, Korean, and hyphens
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
};

/**
 * Fetch all existing slugs from the database
 */
const fetchExistingSlugs = async (): Promise<Set<string>> => {
  const { data, error } = await supabase
    .from('products')
    .select('slug');
  
  if (error) {
    console.error('Error fetching existing slugs:', error);
    return new Set();
  }
  
  return new Set((data || []).map(p => p.slug));
};

/**
 * Generate a unique slug by appending random suffix if needed
 */
const generateUniqueSlug = (
  baseSlug: string, 
  existingSlugs: Set<string>, 
  batchSlugs: Set<string>
): string => {
  let slug = baseSlug;
  let attempts = 0;
  const maxAttempts = 10;
  
  // Check if slug already exists in DB or current batch
  while ((existingSlugs.has(slug) || batchSlugs.has(slug)) && attempts < maxAttempts) {
    const suffix = generateRandomSuffix();
    slug = `${baseSlug}-${suffix}`.substring(0, 100);
    attempts++;
  }
  
  // If still not unique after max attempts, add timestamp
  if (existingSlugs.has(slug) || batchSlugs.has(slug)) {
    slug = `${baseSlug}-${Date.now()}`.substring(0, 100);
  }
  
  return slug;
};

/**
 * Parse CSV file and convert to product data with unique slugs
 */
export const parseProductCSV = async (file: File): Promise<{
  products: ProductImportData[];
  errors: string[];
}> => {
  const fileSizeError = validateFileSize(file);
  if (fileSizeError) {
    throw new Error(fileSizeError);
  }

  const text = await file.text();
  const jsonData = parseCSV(text);

  if (jsonData.length === 0) {
    throw new Error('CSV 파일에 데이터가 없습니다.');
  }

  // Fetch existing slugs from database
  const existingSlugs = await fetchExistingSlugs();
  const batchSlugs = new Set<string>(); // Track slugs within this batch

  const products: ProductImportData[] = [];
  const errors: string[] = [];

  for (let index = 0; index < jsonData.length; index++) {
    const row = jsonData[index];
    
    // Collect all images
    const images: string[] = [];
    const mainImage = row['이미지URL'] || row['image_url'] || '';
    const additionalImage1 = row['추가이미지1'] || row['additional_image_1'] || '';
    const additionalImage2 = row['추가이미지2'] || row['additional_image_2'] || '';
    
    [mainImage, additionalImage1, additionalImage2].forEach(url => {
      if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) {
        images.push(url.substring(0, 500));
      }
    });

    const title = (row['품명'] || row['제품명'] || row['title'] || '').substring(0, 200);
    
    // Generate base slug from CSV or title
    let baseSlug = (row['슬러그'] || row['slug'] || '').trim();
    if (!baseSlug && title) {
      baseSlug = createSlugFromTitle(title);
    }
    if (!baseSlug) {
      baseSlug = `product-${Date.now()}-${index}`;
    }
    
    // Generate unique slug
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs, batchSlugs);
    batchSlugs.add(uniqueSlug); // Track this slug for the current batch

    const productData: ProductImportData = {
      slug: uniqueSlug,
      title,
      description: (row['제품설명'] || row['설명'] || row['description'] || null)?.substring(0, 5000) || null,
      image_url: images[0] || null,
      images,
      badges: row['뱃지'] || row['badges']
        ? String(row['뱃지'] || row['badges']).split(',').map((b: string) => b.trim().substring(0, 50)).slice(0, 10)
        : [],
      features: row['특징'] || row['features']
        ? String(row['특징'] || row['features']).split('|').map((f: string) => f.trim().substring(0, 500)).slice(0, 20)
        : [],
      specs: (() => {
        // specs is now stored as plain text
        const specsStr = row['사양'] || row['specs'] || '';
        const size = row['규격'] || row['size'] || '';
        if (specsStr) return String(specsStr).substring(0, 1000);
        if (size) return String(size).substring(0, 200);
        return null;
      })(),
      main_category: (row['대분류'] || row['main_category'] || null)?.substring(0, 100) || null,
      subcategory: (row['소분류'] || row['subcategory'] || null)?.substring(0, 100) || null,
      display_order: Math.min(Math.max(Number(row['순서'] || row['display_order']) || index, 0), 10000),
      procurement_id: (row['조달식별번호'] || row['조달번호'] || row['procurement_id'] || null)?.substring(0, 50) || null,
      price: (row['가격'] || row['price'] || null)?.substring(0, 50) || null,
      is_active: true,
    };

    // Basic validation
    if (!productData.title) {
      errors.push(`행 ${index + 2}: 품명이 필요합니다.`);
      continue;
    }

    products.push(productData);
  }

  return { products, errors };
};

/**
 * Convert products to CSV export format
 */
export const convertToExportFormat = (products: any[]): ProductExportData[] => {
  return products.map((product, index) => {
    // specs is now a plain string
    const specsValue = product.specs || '';
    
    return {
      슬러그: product.slug || '',
      품명: product.title || '',
      규격: specsValue,
      조달식별번호: product.procurement_id || '',
      가격: product.price || '',
      제품설명: product.description || '',
      이미지URL: product.images?.[0] || product.image_url || '',
      추가이미지1: product.images?.[1] || '',
      추가이미지2: product.images?.[2] || '',
      뱃지: (product.badges || []).join(', '),
      특징: (product.features || []).join(' | '),
      대분류: product.main_category || '',
      소분류: product.subcategory || '',
      순서: product.display_order || index,
    };
  });
};

/**
 * Download products as CSV file
 */
export const exportProductsToCSV = (products: any[], filename: string = '제품_목록.csv') => {
  const exportData = convertToExportFormat(products) as unknown as Record<string, unknown>[];
  downloadCSV(exportData, filename);
};

/**
 * Get CSV template for product upload
 */
export const getProductTemplate = (): ProductExportData[] => {
  return [
    {
      슬러그: 'example-product-1',
      품명: '예시 제품 1',
      규격: 'W1200 x D600 x H750',
      조달식별번호: '12345678',
      가격: '500,000',
      제품설명: '제품 설명을 입력하세요',
      이미지URL: 'https://example.com/image1.jpg',
      추가이미지1: 'https://example.com/image2.jpg',
      추가이미지2: 'https://example.com/image3.jpg',
      뱃지: 'MAS 등록, KS 인증',
      특징: '특징1 | 특징2 | 특징3',
      대분류: 'educational',
      소분류: 'blackboard-cabinet',
      순서: 1,
    },
    {
      슬러그: 'example-product-2',
      품명: '예시 제품 2',
      규격: 'W800 x D500 x H1800',
      조달식별번호: '87654321',
      가격: '350,000',
      제품설명: '두 번째 제품 설명',
      이미지URL: '',
      추가이미지1: '',
      추가이미지2: '',
      뱃지: '친환경',
      특징: '내구성 우수 | 조립 간편',
      대분류: 'office',
      소분류: 'cabinet',
      순서: 2,
    }
  ];
};

/**
 * Download product upload template
 */
export const downloadProductTemplate = () => {
  const template = getProductTemplate() as unknown as Record<string, unknown>[];
  downloadCSV(template, '제품_업로드_템플릿.csv');
};
