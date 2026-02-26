import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { parseProductCSV } from '@/lib/excelUtils';
import {
  parseExcelWithImages,
  uploadRowImages,
  isExcelFile,
  isCSVFile,
  type ExcelRowData,
} from '@/lib/excelImageParser';
import {
  fetchAllExistingProductSlugs,
  generateUniqueSlug,
  stripRandomSuffix,
  createSlugFromTitle,
} from '@/lib/productSlugUtils';
import { logError, getErrorMessage } from '@/lib/errorUtils';

interface UploadProgress {
  current: number;
  total: number;
  currentProduct: string;
  status: 'parsing' | 'uploading-images' | 'inserting' | 'done';
}

interface UseExcelUploadOptions {
  onComplete?: () => void;
}

export interface PendingFileInfo {
  file: File;
  rowCount: number;
  duplicates: string[];
}

export const useExcelUpload = (options?: UseExcelUploadOptions) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [pendingFile, setPendingFile] = useState<PendingFileInfo | null>(null);

  const isSlugConflictError = (err: any) => {
    return (
      err?.code === '23505' &&
      (String(err?.message || '').includes('products_slug_key') ||
        String(err?.details || '').includes('products_slug_key'))
    );
  };

  /**
   * Process Excel row data and upload images
   */
  const processExcelRow = async (
    row: ExcelRowData,
    existingSlugs: Set<string>,
    batchSlugs: Set<string>
  ): Promise<{
    product: any;
    errors: string[];
  }> => {
    const errors: string[] = [];
    const data = row.data;

    // Get title
    const title = (data['품명'] || data['제품명'] || data['title'] || '').substring(0, 200);
    if (!title) {
      errors.push(`행 ${row.rowIndex}: 품명이 필요합니다.`);
      return { product: null, errors };
    }

    // Generate slug
    let baseSlug = (data['슬러그'] || data['slug'] || '').trim();
    if (!baseSlug && title) {
      baseSlug = createSlugFromTitle(title);
    }
    if (!baseSlug) {
      baseSlug = `product-${Date.now()}-${row.rowIndex}`;
    }
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs, batchSlugs);
    batchSlugs.add(uniqueSlug);

    // Upload embedded images if any
    let imageUrls: string[] = [];
    
    if (row.images.length > 0) {
      const uploadResult = await uploadRowImages(row.images, uniqueSlug);
      imageUrls = uploadResult.urls;
      if (uploadResult.errors.length > 0) {
        errors.push(...uploadResult.errors.map(e => `행 ${row.rowIndex}: ${e}`));
      }
    }

    // Also check for URL-based images from data
    const urlImages: string[] = [];
    const mainImageUrl = data['이미지URL'] || data['image_url'] || '';
    const additionalImage1 = data['추가이미지1'] || data['additional_image_1'] || '';
    const additionalImage2 = data['추가이미지2'] || data['additional_image_2'] || '';

    [mainImageUrl, additionalImage1, additionalImage2].forEach(url => {
      if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) {
        urlImages.push(url.substring(0, 500));
      }
    });

    // Combine embedded images with URL images (embedded first)
    const allImages = [...imageUrls, ...urlImages].slice(0, 3);

    const product = {
      slug: uniqueSlug,
      title,
      description: (data['제품설명'] || data['설명'] || data['description'] || null)?.substring(0, 5000) || null,
      image_url: allImages[0] || null,
      images: allImages,
      badges: data['뱃지'] || data['badges']
        ? String(data['뱃지'] || data['badges']).split(',').map((b: string) => b.trim().substring(0, 50)).slice(0, 10)
        : [],
      features: data['특징'] || data['features']
        ? String(data['특징'] || data['features']).split('|').map((f: string) => f.trim().substring(0, 500)).slice(0, 20)
        : [],
      specs: (() => {
        const specsStr = data['사양'] || data['specs'] || '';
        const size = data['규격'] || data['size'] || '';
        if (specsStr) return String(specsStr).substring(0, 1000);
        if (size) return String(size).substring(0, 200);
        return null;
      })(),
      main_category: (data['대분류'] || data['main_category'] || null)?.substring(0, 100) || null,
      subcategory: (data['소분류'] || data['subcategory'] || null)?.substring(0, 100) || null,
      display_order: Math.min(Math.max(Number(data['순서'] || data['display_order']) || row.rowIndex, 0), 10000),
      procurement_id: (data['조달식별번호'] || data['조달번호'] || data['procurement_id'] || null)?.substring(0, 50) || null,
      price: (data['가격'] || data['price'] || null)?.substring(0, 50) || null,
      is_active: true,
    };

    return { product, errors };
  };

  /**
   * Handle Excel file upload with embedded images
   */
  const handleExcelUpload = async (file: File, skipTitles: Set<string> | null = null) => {
    setIsUploading(true);
    setProgress({ current: 0, total: 0, currentProduct: '파싱 중...', status: 'parsing' });

    try {
      const existingSlugs = await fetchAllExistingProductSlugs();
      const batchSlugs = new Set<string>();

      // Parse Excel file
      let { rows, errors: parseErrors, warnings } = await parseExcelWithImages(file);

      // Filter out duplicates if requested
      if (skipTitles) {
        const beforeCount = rows.length;
        rows = rows.filter(r => {
          const title = (r.data['품명'] || r.data['제품명'] || r.data['title'] || '').trim().toLowerCase();
          return !title || !skipTitles.has(title);
        });
        const skippedCount = beforeCount - rows.length;
        if (skippedCount > 0) {
          toast.info(`중복 품목 ${skippedCount}개를 제외했습니다.`);
        }
      }

      if (rows.length === 0) {
        throw new Error('업로드할 유효한 제품이 없습니다.' + (parseErrors.length > 0 ? ` (${parseErrors.join(', ')})` : ''));
      }

      // Show warnings
      if (warnings.length > 0) {
        console.warn('Excel parsing warnings:', warnings);
        toast.warning(`${warnings.length}개의 경고가 있습니다.`, {
          description: warnings.slice(0, 3).join('\n'),
        });
      }

      const allErrors: string[] = [...parseErrors];
      const products: any[] = [];

      // Process each row
      setProgress({ current: 0, total: rows.length, currentProduct: '', status: 'uploading-images' });

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const productTitle = row.data['품명'] || row.data['제품명'] || `제품 ${i + 1}`;
        
        setProgress({
          current: i + 1,
          total: rows.length,
          currentProduct: productTitle,
          status: 'uploading-images',
        });

        const { product, errors } = await processExcelRow(row, existingSlugs, batchSlugs);
        
        if (errors.length > 0) {
          allErrors.push(...errors);
        }
        
        if (product) {
          products.push(product);
        }
      }

      if (products.length === 0) {
        throw new Error('업로드할 유효한 제품이 없습니다.');
      }

      // Insert products
      setProgress({ current: 0, total: products.length, currentProduct: '데이터베이스 저장 중...', status: 'inserting' });

      const newlyGeneratedSlugs = new Set<string>();

      const insertChunkWithRetry = async (chunk: any[]): Promise<number> => {
        const { error } = await supabase.from('products').insert(chunk);
        if (!error) {
          for (const p of chunk) existingSlugs.add(p.slug);
          return chunk.length;
        }

        if (!isSlugConflictError(error)) throw error;

        // Fallback: insert row-by-row
        let inserted = 0;
        for (const original of chunk) {
          let product = original;
          let attempts = 0;

          while (attempts < 8) {
            const { error: rowError } = await supabase.from('products').insert([product]);
            if (!rowError) {
              inserted++;
              existingSlugs.add(product.slug);
              newlyGeneratedSlugs.add(product.slug);
              break;
            }

            if (isSlugConflictError(rowError)) {
              const base = stripRandomSuffix(product.slug) || product.slug;
              const nextSlug = generateUniqueSlug(base, existingSlugs, newlyGeneratedSlugs);
              product = { ...product, slug: nextSlug };
              attempts++;
              continue;
            }

            throw rowError;
          }

          if (attempts >= 8) {
            allErrors.push(`슬러그 중복으로 업로드 실패: ${original?.title || original?.slug}`);
          }
        }

        return inserted;
      };

      const chunkSize = 50; // Smaller chunks for Excel with images
      let insertedCount = 0;
      for (let i = 0; i < products.length; i += chunkSize) {
        const chunk = products.slice(i, i + chunkSize);
        insertedCount += await insertChunkWithRetry(chunk);
        setProgress({
          current: Math.min(i + chunkSize, products.length),
          total: products.length,
          currentProduct: '데이터베이스 저장 중...',
          status: 'inserting',
        });
      }

      setProgress({ current: insertedCount, total: insertedCount, currentProduct: '완료', status: 'done' });

      let successMessage = `${insertedCount}개의 제품이 업로드되었습니다.`;
      if (allErrors.length > 0) {
        successMessage += ` (${allErrors.length}개 오류/건너뜀)`;
        console.error('Upload errors:', allErrors);
      }
      toast.success(successMessage);

      options?.onComplete?.();
    } catch (error: any) {
      logError('Excel upload', error);
      toast.error(error.message || getErrorMessage(error));
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  };

  /**
   * Handle CSV file upload (existing logic)
   */
  const handleCSVUpload = async (file: File, skipTitles: Set<string> | null = null) => {
    setIsUploading(true);

    try {
      const existingSlugs = await fetchAllExistingProductSlugs();
      let { products: parsedProducts, errors } = await parseProductCSV(file, { existingSlugs });

      // Filter out duplicates if requested
      if (skipTitles) {
        const beforeCount = parsedProducts.length;
        parsedProducts = parsedProducts.filter((p: any) => {
          const title = (p.title || '').trim().toLowerCase();
          return !title || !skipTitles.has(title);
        });
        const skippedCount = beforeCount - parsedProducts.length;
        if (skippedCount > 0) {
          toast.info(`중복 품목 ${skippedCount}개를 제외했습니다.`);
        }
      }

      if (parsedProducts.length === 0) {
        throw new Error('업로드할 유효한 제품이 없습니다.');
      }

      const newlyGeneratedSlugs = new Set<string>();
      const extraErrors: string[] = [];

      const isSlugConflict = (err: any) => {
        return (
          err?.code === '23505' &&
          (String(err?.message || '').includes('products_slug_key') ||
            String(err?.details || '').includes('products_slug_key'))
        );
      };

      const insertChunkWithRetry = async (chunk: any[]): Promise<number> => {
        const { error } = await supabase.from('products').insert(chunk);
        if (!error) {
          for (const p of chunk) existingSlugs.add(p.slug);
          return chunk.length;
        }

        if (!isSlugConflict(error)) throw error;

        let inserted = 0;
        for (const original of chunk) {
          let product = original;
          let attempts = 0;

          while (attempts < 8) {
            const { error: rowError } = await supabase.from('products').insert([product]);
            if (!rowError) {
              inserted++;
              existingSlugs.add(product.slug);
              newlyGeneratedSlugs.add(product.slug);
              break;
            }

            if (isSlugConflict(rowError)) {
              const base = stripRandomSuffix(product.slug) || product.slug;
              const nextSlug = generateUniqueSlug(base, existingSlugs, newlyGeneratedSlugs);
              product = { ...product, slug: nextSlug };
              attempts++;
              continue;
            }

            throw rowError;
          }

          if (attempts >= 8) {
            extraErrors.push(`슬러그 중복으로 업로드 실패: ${original?.title || original?.slug}`);
          }
        }

        return inserted;
      };

      const chunkSize = 200;
      let insertedCount = 0;
      for (let i = 0; i < parsedProducts.length; i += chunkSize) {
        const chunk = parsedProducts.slice(i, i + chunkSize);
        insertedCount += await insertChunkWithRetry(chunk);
      }

      let successMessage = `${insertedCount}개의 제품이 업로드되었습니다.`;
      const skipped = errors.length + extraErrors.length;
      if (skipped > 0) successMessage += ` (${skipped}개 오류/건너뜀)`;
      toast.success(successMessage);

      options?.onComplete?.();
    } catch (error: any) {
      logError('CSV upload', error);
      toast.error(error.message || getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Pre-parse file to get row count for confirmation
   */
  const preParseFile = useCallback(async (file: File) => {
    if (!isExcelFile(file) && !isCSVFile(file)) {
      toast.error('지원하지 않는 파일 형식입니다. CSV 또는 Excel(.xlsx) 파일을 업로드해주세요.');
      return;
    }

    try {
      // Fetch existing product titles for duplicate check
      const { data: existingProducts } = await supabase
        .from('products')
        .select('title');
      const existingTitles = new Set(
        (existingProducts || []).map((p) => p.title?.trim().toLowerCase())
      );

      let titles: string[] = [];

      if (isExcelFile(file)) {
        const { rows } = await parseExcelWithImages(file);
        if (rows.length === 0) {
          toast.error('업로드할 유효한 제품이 없습니다.');
          return;
        }
        titles = rows.map((r) => (r.data['품명'] || r.data['제품명'] || r.data['title'] || '').trim());
        const duplicates = titles.filter((t) => t && existingTitles.has(t.toLowerCase()));
        setPendingFile({ file, rowCount: rows.length, duplicates });
      } else {
        const { products } = await parseProductCSV(file, { existingSlugs: new Set() });
        if (products.length === 0) {
          toast.error('업로드할 유효한 제품이 없습니다.');
          return;
        }
        titles = products.map((p: any) => (p.title || '').trim());
        const duplicates = titles.filter((t) => t && existingTitles.has(t.toLowerCase()));
        setPendingFile({ file, rowCount: products.length, duplicates });
      }
    } catch (error: any) {
      logError('File pre-parse', error);
      toast.error(error.message || getErrorMessage(error));
    }
  }, []);

  /**
   * Confirm and proceed with upload
   */
  const confirmUpload = useCallback(async (skipDuplicates = false) => {
    if (!pendingFile) return;
    const { file, duplicates } = pendingFile;
    const duplicateTitlesSet = skipDuplicates && duplicates.length > 0
      ? new Set(duplicates.map(d => d.trim().toLowerCase()))
      : null;
    setPendingFile(null);

    if (isExcelFile(file)) {
      await handleExcelUpload(file, duplicateTitlesSet);
    } else if (isCSVFile(file)) {
      await handleCSVUpload(file, duplicateTitlesSet);
    }
  }, [pendingFile]);

  const cancelUpload = useCallback(() => {
    setPendingFile(null);
  }, []);

  return {
    isUploading,
    progress,
    pendingFile,
    preParseFile,
    confirmUpload,
    cancelUpload,
  };
};
