import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { logError, getErrorMessage } from '@/lib/errorUtils';

interface ImageDropzoneProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const ImageDropzone = ({ images, onChange, maxImages = 3 }: ImageDropzoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const uploadFile = async (file: File): Promise<string | null> => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('JPG, PNG, WebP, GIF 이미지만 업로드 가능합니다.');
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('이미지 크기는 5MB 이하여야 합니다.');
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`최대 ${maxImages}장까지만 업로드 가능합니다.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setIsUploading(true);
    setUploadProgress(`0/${filesToUpload.length} 업로드 중...`);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadProgress(`${i + 1}/${filesToUpload.length} 업로드 중...`);
        const url = await uploadFile(filesToUpload[i]);
        if (url) newUrls.push(url);
      }

      onChange([...images, ...newUrls]);
      toast.success(`${newUrls.length}개 이미지가 업로드되었습니다.`);
    } catch (error: any) {
      logError('Image upload', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [images, maxImages, onChange]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`최대 ${maxImages}장까지만 업로드 가능합니다.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setIsUploading(true);
    setUploadProgress(`0/${filesToUpload.length} 업로드 중...`);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadProgress(`${i + 1}/${filesToUpload.length} 업로드 중...`);
        const url = await uploadFile(filesToUpload[i]);
        if (url) newUrls.push(url);
      }

      onChange([...images, ...newUrls]);
      toast.success(`${newUrls.length}개 이미지가 업로드되었습니다.`);
    } catch (error: any) {
      logError('Image upload', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      e.target.value = '';
    }
  }, [images, maxImages, onChange]);

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  }, [images, onChange]);

  const moveImage = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    onChange(newImages);
  }, [images, onChange]);

  return (
    <div className="space-y-3">
      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, index) => (
            <div
              key={url}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                index === 0 ? 'border-primary ring-2 ring-primary/20' : 'border-border'
              }`}
            >
              <img
                src={url}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === 0 && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                  대표
                </div>
              )}
              <div className="absolute top-1 right-1 flex gap-1">
                {index > 0 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onClick={() => moveImage(index, 0)}
                    title="대표 이미지로 설정"
                  >
                    <GripVertical className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-6 w-6"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {images.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="image-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span className="text-sm text-muted-foreground">{uploadProgress}</span>
              </>
            ) : (
              <>
                <div className="p-3 bg-muted rounded-full">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <span className="text-sm font-medium text-primary">이미지 업로드</span>
                  <span className="text-sm text-muted-foreground"> 또는 드래그 앤 드롭</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  최대 {maxImages}장 (JPG, PNG, WebP, GIF / 각 5MB 이하)
                </span>
              </>
            )}
          </label>
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {images.length}/{maxImages}장 • 첫 번째 이미지가 대표 이미지로 사용됩니다
        </p>
      )}
    </div>
  );
};

export default ImageDropzone;
