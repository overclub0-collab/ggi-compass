import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { logError, getErrorMessage } from '@/lib/errorUtils';

interface DeliveryCaseImageDropzoneProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const DeliveryCaseImageDropzone = ({ 
  images, 
  onChange, 
  maxImages = 20 
}: DeliveryCaseImageDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const uploadFile = async (file: File): Promise<string | null> => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(`${file.name}: JPG, PNG, WebP, GIF 이미지만 업로드 가능합니다.`);
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name}: 이미지 크기는 10MB 이하여야 합니다.`);
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `delivery-cases/${fileName}`;

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
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      toast.warning(`최대 ${maxImages}장까지 업로드 가능합니다. ${remainingSlots}장만 업로드됩니다.`);
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setIsUploading(true);
    setUploadProgress(0);

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < filesToUpload.length; i++) {
      try {
        const url = await uploadFile(filesToUpload[i]);
        if (url) {
          uploadedUrls.push(url);
        }
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      } catch (error: any) {
        logError('Image upload', error);
        toast.error(`${filesToUpload[i].name}: 업로드 실패`);
      }
    }

    if (uploadedUrls.length > 0) {
      onChange([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length}장의 이미지가 업로드되었습니다.`);
    }

    setIsUploading(false);
  }, [images, onChange, maxImages]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      toast.warning(`최대 ${maxImages}장까지 업로드 가능합니다. ${remainingSlots}장만 업로드됩니다.`);
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setIsUploading(true);
    setUploadProgress(0);

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < filesToUpload.length; i++) {
      try {
        const url = await uploadFile(filesToUpload[i]);
        if (url) {
          uploadedUrls.push(url);
        }
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      } catch (error: any) {
        logError('Image upload', error);
        toast.error(`${filesToUpload[i].name}: 업로드 실패`);
      }
    }

    if (uploadedUrls.length > 0) {
      onChange([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length}장의 이미지가 업로드되었습니다.`);
    }

    setIsUploading(false);
    e.target.value = '';
  }, [images, onChange, maxImages]);

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  }, [images, onChange]);

  const moveImage = useCallback((fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onChange(newImages);
  }, [images, onChange]);

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging 
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
          id="delivery-case-images"
          disabled={isUploading || images.length >= maxImages}
        />
        <label 
          htmlFor="delivery-case-images" 
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          {isUploading ? (
            <>
              <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <span className="text-sm text-primary font-medium">
                업로드 중... {uploadProgress}%
              </span>
            </>
          ) : (
            <>
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  클릭하여 파일 선택 또는 드래그 앤 드롭
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, WebP, GIF / 각 10MB 이하 / 최대 {maxImages}장
                </p>
              </div>
            </>
          )}
        </label>
      </div>

      {/* Image Count */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {images.length} / {maxImages}장 업로드됨
          </span>
          {images.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="text-destructive hover:text-destructive"
            >
              전체 삭제
            </Button>
          )}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden border border-border group"
            >
              <img
                src={url}
                alt={`이미지 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Order Badge */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>

              {/* Actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Move Buttons */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {index > 0 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onClick={() => moveImage(index, index - 1)}
                  >
                    ←
                  </Button>
                )}
                {index < images.length - 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onClick={() => moveImage(index, index + 1)}
                  >
                    →
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryCaseImageDropzone;
