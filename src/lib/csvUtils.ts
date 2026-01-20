import { z } from 'zod';

// Maximum file size: 5MB
export const MAX_CSV_FILE_SIZE = 5 * 1024 * 1024;

// Maximum number of rows
export const MAX_CSV_ROWS = 1000;

// Field length limits
const FIELD_LIMITS = {
  slug: 100,
  title: 200,
  description: 5000,
  image_url: 500,
  badges: 500,
  features: 2000,
  specs: 5000,
  category: 100,
  main_category: 100,
  subcategory: 100,
  procurement_id: 50,
  price: 50,
};

// Product validation schema
const productSchema = z.object({
  slug: z.string().max(FIELD_LIMITS.slug, `슬러그는 ${FIELD_LIMITS.slug}자 이하여야 합니다.`).min(1, '슬러그는 필수입니다.'),
  title: z.string().max(FIELD_LIMITS.title, `품명은 ${FIELD_LIMITS.title}자 이하여야 합니다.`).min(1, '품명은 필수입니다.'),
  description: z.string().max(FIELD_LIMITS.description).nullable().optional(),
  image_url: z.string().max(FIELD_LIMITS.image_url).nullable().optional().refine(
    (val) => !val || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/'),
    { message: '이미지 URL 형식이 올바르지 않습니다.' }
  ),
  badges: z.array(z.string().max(50)).optional(),
  features: z.array(z.string().max(500)).optional(),
  specs: z.record(z.unknown()).optional(),
  category: z.string().max(FIELD_LIMITS.category).nullable().optional(),
  main_category: z.string().max(FIELD_LIMITS.main_category).nullable().optional(),
  subcategory: z.string().max(FIELD_LIMITS.subcategory).nullable().optional(),
  display_order: z.number().int().min(0).max(10000).optional(),
  procurement_id: z.string().max(FIELD_LIMITS.procurement_id).nullable().optional(),
  price: z.string().max(FIELD_LIMITS.price).nullable().optional(),
  is_active: z.boolean().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

/**
 * Validates file size for CSV uploads
 */
export const validateFileSize = (file: File): string | null => {
  if (file.size > MAX_CSV_FILE_SIZE) {
    return `CSV 파일은 ${MAX_CSV_FILE_SIZE / (1024 * 1024)}MB 이하여야 합니다.`;
  }
  return null;
};

/**
 * Safely parses CSV text with proper handling of quoted fields and special characters
 */
export const parseCSV = (text: string): Record<string, string>[] => {
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV 파일에 헤더와 데이터가 필요합니다.');
  }
  
  if (lines.length > MAX_CSV_ROWS + 1) {
    throw new Error(`CSV 파일은 최대 ${MAX_CSV_ROWS}개의 행만 처리할 수 있습니다.`);
  }
  
  // Parse header row
  const headers = parseCSVLine(lines[0]);
  
  if (headers.length === 0) {
    throw new Error('CSV 헤더가 비어있습니다.');
  }
  
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      // Sanitize and limit field length
      const value = (values[index] || '').trim();
      row[header] = value.substring(0, 10000); // Hard limit on any field
    });
    
    rows.push(row);
  }
  
  return rows;
};

/**
 * Parse a single CSV line handling quoted fields correctly
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  // Push the last field
  result.push(current.trim());
  
  return result;
};

/**
 * Validates a product object from CSV data
 */
export const validateProduct = (productData: unknown): { success: true; data: ProductInput } | { success: false; error: string } => {
  try {
    const validated = productSchema.parse(productData);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: `${firstError.path.join('.')}: ${firstError.message}` };
    }
    return { success: false, error: '데이터 유효성 검사에 실패했습니다.' };
  }
};

/**
 * Safely parse JSON specs with validation
 */
export const parseSpecs = (specsStr: string | undefined | null): Record<string, unknown> => {
  if (!specsStr || !specsStr.trim()) {
    return {};
  }
  
  try {
    const parsed = JSON.parse(specsStr);
    
    // Ensure it's an object
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      return {};
    }
    
    // Limit the number of keys
    const keys = Object.keys(parsed);
    if (keys.length > 50) {
      throw new Error('사양 항목이 너무 많습니다.');
    }
    
    return parsed;
  } catch {
    return {};
  }
};

/**
 * Generate CSV content from data array
 */
export const generateCSV = (data: Record<string, unknown>[]): string => {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = String(row[header] || '');
        // Escape commas, quotes, and newlines
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
};

/**
 * Trigger a CSV file download
 */
export const downloadCSV = (data: Record<string, unknown>[], filename: string): void => {
  const csv = generateCSV(data);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
