import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { logError, getErrorMessage } from '@/lib/errorUtils';

interface CategoryImageUploadProps {
  imageUrl: string;
  onChange: (url: string) => void;
}

const CategoryImageUpload = ({ imageUrl, onChange }: CategoryImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File): Promise<string | null> => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('JPG, PNG, WebP, GIF, SVG 이미지만 업로드 가능합니다.');
      return null;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('이미지 크기는 2MB 이하여야 합니다.');
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `categories/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleFile = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      if (url) {
        onChange(url);
        toast.success('썸네일이 업로드되었습니다.');
      }
    } catch (error: any) {
      logError('Category image upload', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files[0]) handleFile(files[0]);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  return (
    <div className="space-y-2">
      {imageUrl ? (
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-xl border-2 border-border overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt="카테고리 썸네일"
              className="w-full h-full object-contain"
            />
          </div>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
            onClick={() => onChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
          {/* Replace button */}
          <label className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors">
            <Upload className="h-3 w-3" />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`w-full h-24 border-2 border-dashed rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="category-thumb-upload"
            disabled={isUploading}
          />
          <label htmlFor="category-thumb-upload" className="cursor-pointer flex items-center gap-3 p-4">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                <span className="text-sm text-muted-foreground">업로드 중...</span>
              </>
            ) : (
              <>
                <div className="p-2 rounded-full bg-muted">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <span className="text-sm text-primary font-medium block">이미지 업로드</span>
                  <span className="text-xs text-muted-foreground">클릭 또는 드래그 • 2MB 이하</span>
                </div>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
};

export default CategoryImageUpload;
