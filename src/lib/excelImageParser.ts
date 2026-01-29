import ExcelJS from 'exceljs';
import { supabase } from '@/integrations/supabase/client';

// Supported image types
const SUPPORTED_IMAGE_TYPES = ['png', 'jpeg', 'jpg', 'gif', 'webp'];

// Max image size: 5MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// Max images per row
const MAX_IMAGES_PER_ROW = 3;

export interface ExcelRowData {
  rowIndex: number;
  data: Record<string, string>;
  images: ExcelImageData[];
}

export interface ExcelImageData {
  extension: string;
  buffer: Uint8Array;
  anchorRow: number;
  anchorCol: number;
}

export interface ParsedExcelResult {
  rows: ExcelRowData[];
  errors: string[];
  warnings: string[];
}

export interface ImageUploadResult {
  url: string;
  error?: string;
}

/**
 * Validates image data
 */
const validateImage = (image: ExcelImageData, rowNum: number): string | null => {
  const extension = image.extension.toLowerCase();
  
  if (!SUPPORTED_IMAGE_TYPES.includes(extension)) {
    return `행 ${rowNum}: 지원하지 않는 이미지 형식 (${extension}). 지원 형식: ${SUPPORTED_IMAGE_TYPES.join(', ')}`;
  }
  
  if (image.buffer.byteLength > MAX_IMAGE_SIZE) {
    const sizeMB = (image.buffer.byteLength / (1024 * 1024)).toFixed(2);
    return `행 ${rowNum}: 이미지 용량 초과 (${sizeMB}MB). 최대 5MB까지 허용됩니다.`;
  }
  
  return null;
};

/**
 * Parse Excel file and extract both data and embedded images
 */
export const parseExcelWithImages = async (file: File): Promise<ParsedExcelResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: ExcelRowData[] = [];
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('엑셀 파일에 시트가 없습니다.');
    }
    
    // Get headers from first row
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      headers[colNumber] = String(cell.value || '').trim();
    });
    
    if (headers.filter(h => h).length === 0) {
      throw new Error('엑셀 파일에 헤더가 없습니다.');
    }
    
    // Get all images and map them to rows
    const imagesByRow: Map<number, ExcelImageData[]> = new Map();
    
    // ExcelJS stores images in worksheet.getImages()
    const images = worksheet.getImages();
    
    for (const image of images) {
      const imageId = image.imageId;
      const workbookImage = workbook.getImage(Number(imageId));
      
      if (!workbookImage || !workbookImage.buffer) continue;
      
      // Get anchor position (row where image is placed)
      const anchor = image.range;
      const anchorRow = anchor.tl.row + 1; // Convert to 1-based index
      const anchorCol = anchor.tl.col + 1;
      
      // Convert buffer to Uint8Array
      const bufferData = workbookImage.buffer;
      const uint8Array = bufferData instanceof Uint8Array 
        ? bufferData 
        : new Uint8Array(bufferData as ArrayBuffer);
      
      const imageData: ExcelImageData = {
        extension: workbookImage.extension || 'png',
        buffer: uint8Array,
        anchorRow,
        anchorCol,
      };
      
      // Validate image
      const validationError = validateImage(imageData, anchorRow);
      if (validationError) {
        warnings.push(validationError);
        continue;
      }
      
      // Group images by row
      if (!imagesByRow.has(anchorRow)) {
        imagesByRow.set(anchorRow, []);
      }
      
      const rowImages = imagesByRow.get(anchorRow)!;
      if (rowImages.length < MAX_IMAGES_PER_ROW) {
        rowImages.push(imageData);
      } else {
        warnings.push(`행 ${anchorRow}: 이미지가 ${MAX_IMAGES_PER_ROW}개를 초과하여 일부가 무시됩니다.`);
      }
    }
    
    // Parse data rows (starting from row 2)
    const rowCount = worksheet.rowCount;
    for (let rowIndex = 2; rowIndex <= rowCount; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      const rowData: Record<string, string> = {};
      let hasData = false;
      
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          const value = String(cell.value || '').trim();
          rowData[header] = value;
          if (value) hasData = true;
        }
      });
      
      // Skip empty rows
      if (!hasData && !imagesByRow.has(rowIndex)) continue;
      
      rows.push({
        rowIndex,
        data: rowData,
        images: imagesByRow.get(rowIndex) || [],
      });
    }
    
    if (rows.length === 0) {
      throw new Error('엑셀 파일에 데이터가 없습니다.');
    }
    
    return { rows, errors, warnings };
  } catch (error: any) {
    errors.push(error.message || '엑셀 파일 파싱 중 오류가 발생했습니다.');
    return { rows: [], errors, warnings };
  }
};

/**
 * Upload image buffer to Supabase Storage
 */
export const uploadImageToStorage = async (
  imageBuffer: Uint8Array,
  extension: string,
  productSlug: string,
  imageIndex: number
): Promise<ImageUploadResult> => {
  try {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${productSlug}-${imageIndex}-${timestamp}-${randomSuffix}.${extension}`;
    const filePath = `products/${fileName}`;
    
    // Create a proper ArrayBuffer from Uint8Array
    const arrayBuffer = new ArrayBuffer(imageBuffer.byteLength);
    new Uint8Array(arrayBuffer).set(imageBuffer);
    const blob = new Blob([arrayBuffer], { type: `image/${extension}` });
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, blob, {
        contentType: `image/${extension}`,
        upsert: false,
      });
    
    if (error) {
      console.error('Image upload error:', error);
      return { url: '', error: error.message };
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
    
    return { url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Image upload exception:', error);
    return { url: '', error: error.message || '이미지 업로드 실패' };
  }
};

/**
 * Upload all images for a product row and return URLs
 */
export const uploadRowImages = async (
  images: ExcelImageData[],
  productSlug: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ urls: string[]; errors: string[] }> => {
  const urls: string[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    onProgress?.(i + 1, images.length);
    
    const result = await uploadImageToStorage(
      image.buffer,
      image.extension,
      productSlug,
      i + 1
    );
    
    if (result.error) {
      errors.push(`이미지 ${i + 1} 업로드 실패: ${result.error}`);
    } else if (result.url) {
      urls.push(result.url);
    }
  }
  
  return { urls, errors };
};

/**
 * Check if file is an Excel file
 */
export const isExcelFile = (file: File): boolean => {
  const excelTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];
  const excelExtensions = ['.xlsx', '.xls'];
  
  return (
    excelTypes.includes(file.type) ||
    excelExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  );
};

/**
 * Check if file is a CSV file
 */
export const isCSVFile = (file: File): boolean => {
  return (
    file.type === 'text/csv' ||
    file.name.toLowerCase().endsWith('.csv')
  );
};
