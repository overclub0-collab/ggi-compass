import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, ImagePlus, Sparkles, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferenceImageManagerProps {
  productId: string;
  productTitle: string;
  referenceImages: string[];
  aiGeneratedImages: string[];
  onUpdate: (referenceImages: string[], aiGeneratedImages: string[]) => void;
}

export default function ReferenceImageManager({
  productId,
  productTitle,
  referenceImages,
  aiGeneratedImages,
  onUpdate,
}: ReferenceImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const totalAfter = referenceImages.length + files.length;
    if (totalAfter > 20) {
      toast.error('참조 이미지는 최대 20장까지 업로드 가능합니다');
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${productId}/ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('furniture-references')
          .upload(path, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('furniture-references')
          .getPublicUrl(path);

        if (urlData?.publicUrl) {
          newUrls.push(urlData.publicUrl);
        }
      }

      if (newUrls.length > 0) {
        const updated = [...referenceImages, ...newUrls];
        // Save to DB
        await supabase
          .from('furniture_analysis_cache')
          .update({ reference_images: updated })
          .eq('product_id', productId);
        
        onUpdate(updated, aiGeneratedImages);
        toast.success(`${newUrls.length}장의 참조 이미지가 업로드되었습니다`);
      }
    } catch (e) {
      toast.error('이미지 업로드에 실패했습니다');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteRefImage = async (url: string) => {
    const updated = referenceImages.filter(u => u !== url);
    
    // Delete from storage
    try {
      const path = url.split('/furniture-references/')[1];
      if (path) {
        await supabase.storage.from('furniture-references').remove([path]);
      }
    } catch (e) {
      console.error('Storage delete error:', e);
    }

    await supabase
      .from('furniture_analysis_cache')
      .update({ reference_images: updated })
      .eq('product_id', productId);

    onUpdate(updated, aiGeneratedImages);
    toast.success('참조 이미지가 삭제되었습니다');
  };

  const handleDeleteAiImage = async (url: string) => {
    const updated = aiGeneratedImages.filter(u => u !== url);
    
    try {
      const path = url.split('/furniture-references/')[1];
      if (path) {
        await supabase.storage.from('furniture-references').remove([path]);
      }
    } catch (e) {
      console.error('Storage delete error:', e);
    }

    await supabase
      .from('furniture_analysis_cache')
      .update({ ai_generated_images: updated })
      .eq('product_id', productId);

    onUpdate(referenceImages, updated);
    toast.success('AI 생성 이미지가 삭제되었습니다');
  };

  const handleGenerateAiImages = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-furniture-image', {
        body: {
          product_id: productId,
          product_name: productTitle,
          reference_images: referenceImages.slice(0, 5), // Send up to 5 for context
        },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.error.includes('크레딧') || data.error.includes('402')) {
          toast.error('AI 크레딧이 부족합니다.');
        } else {
          toast.error(data.error);
        }
        return;
      }

      if (data?.generated_urls?.length > 0) {
        const updated = [...aiGeneratedImages, ...data.generated_urls];
        await supabase
          .from('furniture_analysis_cache')
          .update({ ai_generated_images: updated })
          .eq('product_id', productId);
        
        onUpdate(referenceImages, updated);
        toast.success(`${data.generated_urls.length}장의 AI 추론 이미지가 생성되었습니다`);
      }
    } catch (e: any) {
      toast.error('AI 이미지 생성에 실패했습니다');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Reference Images Upload */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-bold flex items-center gap-1">
            <ImagePlus className="h-3.5 w-3.5" />
            참조 이미지 ({referenceImages.length}/20)
          </Label>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3 w-3 mr-1" />
              {uploading ? '업로드 중...' : '이미지 추가'}
            </Button>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUploadFiles(e.target.files)}
        />

        <p className="text-[10px] text-muted-foreground mb-2">
          측면, 후면, 디테일 컷 등 다각도 참조 사진을 업로드하면 AI 분석 정확도가 향상됩니다. (최대 20장)
        </p>

        {referenceImages.length > 0 ? (
          <div className="grid grid-cols-5 gap-2">
            {referenceImages.map((url, idx) => (
              <div key={idx} className="relative group aspect-square rounded-md overflow-hidden bg-muted border">
                <img src={url} alt={`참조 ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDeleteRefImage(url)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <Badge className="absolute bottom-1 left-1 text-[8px] bg-background/80 text-foreground">
                  {idx + 1}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors',
              uploading && 'opacity-50 pointer-events-none'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">클릭하거나 이미지를 드래그하여 업로드</p>
          </div>
        )}
      </div>

      {/* AI Generated Images */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-bold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI 추론 이미지 ({aiGeneratedImages.length})
          </Label>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={generating}
            onClick={handleGenerateAiImages}
          >
            {generating ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            {generating ? '생성 중...' : 'AI 이미지 생성'}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground mb-2">
          AI가 제품 분석 데이터를 기반으로 다각도 추론 이미지를 자동 생성합니다. 검토 후 불필요한 이미지를 삭제할 수 있습니다.
        </p>

        {aiGeneratedImages.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {aiGeneratedImages.map((url, idx) => (
              <div key={idx} className="relative group aspect-square rounded-md overflow-hidden bg-muted border">
                <img src={url} alt={`AI 추론 ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDeleteAiImage(url)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <Badge className="absolute bottom-1 left-1 text-[8px] bg-primary text-primary-foreground">
                  AI {idx + 1}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed rounded-lg p-4 text-center text-muted-foreground">
            <Sparkles className="h-5 w-5 mx-auto mb-1 opacity-30" />
            <p className="text-[10px]">AI 이미지 생성 버튼을 클릭하여 추론 이미지를 생성하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
