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

type ExcelImageRange =
  | string
  | {
      tl?: { row?: number; col?: number; nativeRow?: number; nativeCol?: number };
      br?: { row?: number; col?: number; nativeRow?: number; nativeCol?: number };
    };

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

const columnLettersToNumber = (letters: string) => {
  // A -> 1, B -> 2, ... Z -> 26, AA -> 27
  let sum = 0;
  for (const ch of letters.toUpperCase()) {
    const code = ch.charCodeAt(0);
    if (code < 65 || code > 90) continue;
    sum = sum * 26 + (code - 64);
  }
  return sum;
};

const parseA1 = (a1: string): { row: number; col: number } | null => {
  const m = String(a1).trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  const col = columnLettersToNumber(m[1]);
  const row = Number(m[2]);
  if (!Number.isFinite(row) || row <= 0 || col <= 0) return null;
  return { row, col };
};

/**
 * ExcelJS range formats vary by Excel version and image type.
 * - Can be an object with tl/br (0-based)
 * - Can be an A1 string like "G2" or "G2:H6"
 * This normalizes to 1-based row/col and clamps into the worksheet bounds.
 */
const getAnchorRowCol = (
  range: ExcelImageRange,
  worksheetRowCount: number
): { row: number; col: number } | null => {
  try {
    if (!range) return null;

    if (typeof range === 'string') {
      const first = range.split(':')[0];
      const pos = parseA1(first);
      if (!pos) return null;
      const row = Math.max(2, Math.min(pos.row, Math.max(2, worksheetRowCount || pos.row)));
      const col = Math.max(1, pos.col);
      return { row, col };
    }

    const tl = range.tl;
    if (!tl) return null;

    // ExcelJS typically stores 0-based row/col for anchors.
    const rawRow = (tl.nativeRow ?? tl.row);
    const rawCol = (tl.nativeCol ?? tl.col);
    if (rawRow === undefined || rawCol === undefined) return null;

    const oneBasedRow = Number(rawRow) + 1;
    const oneBasedCol = Number(rawCol) + 1;
    if (!Number.isFinite(oneBasedRow) || !Number.isFinite(oneBasedCol)) return null;

    const row = Math.max(2, Math.min(oneBasedRow, Math.max(2, worksheetRowCount || oneBasedRow)));
    const col = Math.max(1, oneBasedCol);
    return { row, col };
  } catch {
    return null;
  }
};

const rowHasAnyData = (rowData: Record<string, string>) => {
  return Object.values(rowData).some((v) => String(v || '').trim().length > 0);
};

const findNearestDataRowIndex = (
  targetRowIndex: number,
  dataRowIndexes: number[],
  maxDistance: number
): number | null => {
  if (dataRowIndexes.length === 0) return null;
  let best: number | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const r of dataRowIndexes) {
    const dist = Math.abs(r - targetRowIndex);
    if (dist > maxDistance) continue;
    if (dist < bestDist) {
      bestDist = dist;
      best = r;
    } else if (dist === bestDist && best !== null) {
      // tie-break: prefer previous row
      if (r < best) best = r;
    }
  }
  return best;
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
      // Normalize headers (e.g., "품명 *" -> "품명") to be compatible with templates
      const raw = String((cell as any).text ?? cell.value ?? '').trim();
      headers[colNumber] = raw.replace(/\s*\*+\s*$/g, '').trim();
    });
    
    if (headers.filter(h => h).length === 0) {
      throw new Error('엑셀 파일에 헤더가 없습니다.');
    }
    
    // Get all images and map them to rows
    const imagesByRow: Map<number, ExcelImageData[]> = new Map();

    // ExcelJS stores drawing images here; range format varies (object or A1 string)
    const images = worksheet.getImages();

    for (const image of images) {
      try {
        const imageId = (image as any).imageId;
        const workbookImage = workbook.getImage(Number(imageId));

        if (!workbookImage || !workbookImage.buffer) continue;

        const anchor = getAnchorRowCol((image as any).range as ExcelImageRange, worksheet.rowCount);
        if (!anchor) {
          warnings.push('이미지 위치(Anchor)를 확인할 수 없어 해당 이미지를 건너뜁니다. (엑셀 이미지 타입/앵커 호환성)');
          continue;
        }

        const bufferData = workbookImage.buffer;
        const uint8Array = bufferData instanceof Uint8Array
          ? bufferData
          : new Uint8Array(bufferData as ArrayBuffer);

        const imageData: ExcelImageData = {
          extension: workbookImage.extension || 'png',
          buffer: uint8Array,
          anchorRow: anchor.row,
          anchorCol: anchor.col,
        };

        const validationError = validateImage(imageData, anchor.row);
        if (validationError) {
          warnings.push(validationError);
          continue;
        }

        if (!imagesByRow.has(anchor.row)) {
          imagesByRow.set(anchor.row, []);
        }

        const rowImages = imagesByRow.get(anchor.row)!;
        if (rowImages.length < MAX_IMAGES_PER_ROW) {
          rowImages.push(imageData);
        } else {
          warnings.push(`행 ${anchor.row}: 이미지가 ${MAX_IMAGES_PER_ROW}개를 초과하여 일부가 무시됩니다.`);
        }
      } catch (e: any) {
        // Never let a single image kill the whole file parsing
        warnings.push(`이미지 파싱 중 일부 오류가 발생하여 해당 이미지를 건너뜁니다. (${e?.message || 'unknown'})`);
        continue;
      }
    }
    
    // Parse data rows (starting from row 2)
    const rowCount = worksheet.rowCount;
    for (let rowIndex = 2; rowIndex <= rowCount; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      const rowData: Record<string, string> = {};

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber];
        if (!header) return;
        const value = String((cell as any).text ?? cell.value ?? '').trim();
        rowData[header] = value;
      });

      const hasData = rowHasAnyData(rowData);

      // Skip empty rows (unless they contain images)
      if (!hasData && !imagesByRow.has(rowIndex)) continue;

      rows.push({
        rowIndex,
        data: rowData,
        images: imagesByRow.get(rowIndex) || [],
      });
    }

    // Second pass: if an image is anchored just outside the intended data row,
    // auto-map it to the nearest data row to avoid index errors and "empty row" products.
    const dataRowIndexes = rows
      .filter((r) => rowHasAnyData(r.data))
      .map((r) => r.rowIndex);

    if (dataRowIndexes.length > 0) {
      const MAX_AUTO_MAP_DISTANCE = 2;

      const imagesNeedingRemap = rows.filter((r) => !rowHasAnyData(r.data) && r.images.length > 0);
      for (const imgRow of imagesNeedingRemap) {
        const target = findNearestDataRowIndex(imgRow.rowIndex, dataRowIndexes, MAX_AUTO_MAP_DISTANCE);
        if (!target) continue;

        const targetRow = rows.find((r) => r.rowIndex === target);
        if (!targetRow) continue;

        const available = Math.max(0, MAX_IMAGES_PER_ROW - targetRow.images.length);
        if (available <= 0) {
          warnings.push(`행 ${imgRow.rowIndex}: 이미지가 인접 행으로 자동 매핑되지 못했습니다. (행당 최대 ${MAX_IMAGES_PER_ROW}개 초과)`);
          continue;
        }

        const moved = imgRow.images.slice(0, available);
        targetRow.images.push(...moved);
        imgRow.images = imgRow.images.slice(moved.length);
      }

      // Remove rows that still have no data and no images
      for (let i = rows.length - 1; i >= 0; i--) {
        const r = rows[i];
        if (!rowHasAnyData(r.data) && r.images.length === 0) rows.splice(i, 1);
      }
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
    const normalizedExt = String(extension || 'png').toLowerCase();
    const mimeExt = normalizedExt === 'jpg' ? 'jpeg' : normalizedExt;

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${productSlug}-${imageIndex}-${timestamp}-${randomSuffix}.${normalizedExt}`;
    const filePath = `products/${fileName}`;
    
    // Create a proper ArrayBuffer from Uint8Array
    const arrayBuffer = new ArrayBuffer(imageBuffer.byteLength);
    new Uint8Array(arrayBuffer).set(imageBuffer);
    const blob = new Blob([arrayBuffer], { type: `image/${mimeExt}` });
    
    const UPLOAD_TIMEOUT_MS = 45_000;
    const MAX_RETRIES = 2;

    const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('업로드 시간이 초과되었습니다.')), ms)),
      ]);
    };

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    let lastError: any = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const { error } = await withTimeout(
        supabase.storage
          .from('product-images')
          .upload(filePath, blob, {
            contentType: `image/${mimeExt}`,
            upsert: false,
          }),
        UPLOAD_TIMEOUT_MS
      ).catch((e) => ({ error: e } as any));

      if (!error) {
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        return { url: urlData.publicUrl };
      }

      // If the upload succeeded but the client timed out/retried, we can see a 409.
      // In that case, treat as success and return the public URL.
      const msg = String((error as any)?.message || (error as any)?.error_description || error);
      const status = (error as any)?.statusCode ?? (error as any)?.status;
      if (
        status === 409 ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('exists')
      ) {
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        return { url: urlData.publicUrl };
      }

      lastError = error;
      if (attempt < MAX_RETRIES) {
        await sleep(400 * Math.pow(2, attempt));
      }
    }

    console.error('Image upload error:', lastError);
    return { url: '', error: lastError?.message || '이미지 업로드 실패' };
    
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

  // Upload per-row images concurrently (max 3), so large files don't feel "stuck"
  const results = await Promise.allSettled(
    images.map(async (image, idx) => {
      onProgress?.(idx + 1, images.length);
      return await uploadImageToStorage(image.buffer, image.extension, productSlug, idx + 1);
    })
  );

  results.forEach((res, idx) => {
    if (res.status === 'rejected') {
      errors.push(`이미지 ${idx + 1} 업로드 실패: ${res.reason?.message || 'unknown'}`);
      return;
    }
    if (res.value.error) {
      errors.push(`이미지 ${idx + 1} 업로드 실패: ${res.value.error}`);
    } else if (res.value.url) {
      urls.push(res.value.url);
    }
  });
  
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
