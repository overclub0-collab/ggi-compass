import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface CompanyImageDropzoneProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

const CompanyImageDropzone = ({ images, onChange, maxImages = 10 }: CompanyImageDropzoneProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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
    const fileName = `company/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast.error(`최대 ${maxImages}장까지 업로드 가능합니다.`);
      return;
    }

    const filesToUpload = imageFiles.slice(0, remaining);
    setIsUploading(true);

    try {
      const urls: string[] = [];
      for (const file of filesToUpload) {
        const url = await uploadFile(file);
        if (url) urls.push(url);
      }
      if (urls.length > 0) {
        onChange([...images, ...urls]);
        toast.success(`${urls.length}장의 이미지가 업로드되었습니다.`);
      }
    } catch (error: any) {
      toast.error('이미지 업로드 실패: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  }, [images, onChange, maxImages]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(e.target.files || []));
    e.target.value = '';
  }, [handleFiles]);

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Uploaded images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {images.map((url, index) => (
            <div key={index} className="relative aspect-[4/3] rounded-lg overflow-hidden border group">
              <img src={url} alt={`이미지 ${index + 1}`} className="w-full h-full object-cover" />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded font-medium">
                  대표
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer ${
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="company-image-upload"
            disabled={isUploading}
          />
          <label htmlFor="company-image-upload" className="cursor-pointer flex flex-col items-center gap-2">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                <span className="text-xs text-muted-foreground">업로드 중...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  클릭 또는 드래그하여 이미지 추가 ({images.length}/{maxImages})
                </span>
              </>
            )}
          </label>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        JPG, PNG, WebP, GIF / 각 5MB 이하 • 최대 {maxImages}장
      </p>
    </div>
  );
};

export default CompanyImageDropzone;
