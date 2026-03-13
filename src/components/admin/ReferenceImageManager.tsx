import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Upload, Trash2, ImagePlus, Sparkles, RefreshCw, X, Camera, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferenceImageManagerProps {
  productId: string;
  productTitle: string;
  referenceImages: string[];
  aiGeneratedImages: string[];
  onUpdate: (referenceImages: string[], aiGeneratedImages: string[]) => void;
}

const VIEW_ANGLE_OPTIONS = [
  { id: 'quarter-front', name: '쿼터뷰 (전면)', icon: '◢', description: '3/4 전면 각도' },
  { id: 'quarter-back', name: '쿼터뷰 (후면)', icon: '◣', description: '3/4 후면 각도' },
  { id: 'top-down', name: '탑뷰 (상면)', icon: '◻', description: '위에서 내려다본 뷰' },
  { id: 'side-left', name: '사이드뷰 (좌측)', icon: '▮', description: '좌측 측면' },
  { id: 'front', name: '정면뷰', icon: '▣', description: '정면 직선 뷰' },
  { id: 'detail-close', name: '디테일 클로즈업', icon: '🔍', description: '소재/하드웨어 디테일' },
];

export default function ReferenceImageManager({
  productId,
  productTitle,
  referenceImages,
  aiGeneratedImages,
  onUpdate,
}: ReferenceImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, currentView: '' });
  const [selectedViews, setSelectedViews] = useState<string[]>(['quarter-front', 'quarter-back', 'top-down']);
  const [showViewSelector, setShowViewSelector] = useState(false);
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

  const handleDeleteAllAiImages = async () => {
    if (!confirm('모든 AI 생성 이미지를 삭제하시겠습니까?')) return;
    
    for (const url of aiGeneratedImages) {
      try {
        const path = url.split('/furniture-references/')[1];
        if (path) await supabase.storage.from('furniture-references').remove([path]);
      } catch {}
    }

    await supabase
      .from('furniture_analysis_cache')
      .update({ ai_generated_images: [] })
      .eq('product_id', productId);

    onUpdate(referenceImages, []);
    toast.success('모든 AI 생성 이미지가 삭제되었습니다');
  };

  const toggleView = (viewId: string) => {
    setSelectedViews(prev =>
      prev.includes(viewId)
        ? prev.filter(v => v !== viewId)
        : [...prev, viewId]
    );
  };

  const handleGenerateAiImages = async () => {
    if (selectedViews.length === 0) {
      toast.error('최소 1개의 뷰 앵글을 선택해주세요');
      return;
    }

    setGenerating(true);
    setGenerationProgress({ current: 0, total: selectedViews.length, currentView: '' });

    try {
      // Show which view is being generated
      const firstViewName = VIEW_ANGLE_OPTIONS.find(v => v.id === selectedViews[0])?.name || '';
      setGenerationProgress({ current: 0, total: selectedViews.length, currentView: firstViewName });

      const { data, error } = await supabase.functions.invoke('generate-furniture-image', {
        body: {
          product_id: productId,
          product_name: productTitle,
          reference_images: referenceImages.slice(0, 5),
          view_angles: selectedViews,
        },
      });

      if (error) {
        let errorMsg = '알 수 없는 오류';
        try {
          const ctx = (error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            errorMsg = body?.error || error.message;
          } else {
            errorMsg = error.message || '알 수 없는 오류';
          }
        } catch {
          errorMsg = error.message || '알 수 없는 오류';
        }
        
        if (errorMsg.includes('크레딧') || errorMsg.includes('credit') || errorMsg.includes('402')) {
          toast.error('AI 크레딧이 부족합니다. Lovable 대시보드에서 크레딧을 충전해주세요.', { duration: 8000 });
        } else {
          toast.error(`AI 이미지 생성 실패: ${errorMsg}`);
        }
        return;
      }

      if (data?.error) {
        if (data.error.includes('크레딧') || data.error.includes('402')) {
          toast.error('AI 크레딧이 부족합니다. Lovable 대시보드에서 크레딧을 충전해주세요.', { duration: 8000 });
        } else {
          toast.error(data.error);
        }
        return;
      }

      const results = data?.generated_results || [];
      const urls = results.map((r: any) => r.url);

      if (urls.length > 0) {
        const updated = [...aiGeneratedImages, ...urls];
        await supabase
          .from('furniture_analysis_cache')
          .update({ ai_generated_images: updated })
          .eq('product_id', productId);
        
        onUpdate(referenceImages, updated);
        
        const failedViews = data?.errors || [];
        if (failedViews.length > 0) {
          toast.success(`${urls.length}장 생성 완료 (${failedViews.length}개 뷰 실패: ${failedViews.join(', ')})`);
        } else {
          toast.success(`${urls.length}장의 다각도 AI 이미지가 생성되었습니다`);
        }
      }

      setGenerationProgress({ current: selectedViews.length, total: selectedViews.length, currentView: '완료' });
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('402') || msg.includes('크레딧')) {
        toast.error('AI 크레딧이 부족합니다. Lovable 대시보드에서 크레딧을 충전해주세요.', { duration: 8000 });
      } else {
        toast.error('AI 이미지 생성에 실패했습니다');
      }
    } finally {
      setGenerating(false);
      setGenerationProgress({ current: 0, total: 0, currentView: '' });
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
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUploadFiles(e.target.files)}
        />

        <p className="text-[10px] text-muted-foreground mb-2">
          측면, 후면, 하부 구조, 디테일 컷 등 다각도 참조 사진을 업로드하면 AI가 더 정확한 이미지를 생성합니다. (최대 20장)
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
            AI 다각도 추론 이미지 ({aiGeneratedImages.length})
          </Label>
          <div className="flex gap-1">
            {aiGeneratedImages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={handleDeleteAllAiImages}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                전체 삭제
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowViewSelector(!showViewSelector)}
              disabled={generating}
            >
              <Camera className="h-3 w-3 mr-1" />
              뷰 선택
            </Button>
          </div>
        </div>

        {/* View Angle Selector */}
        {showViewSelector && (
          <div className="border rounded-lg p-3 mb-3 bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-foreground">생성할 뷰 앵글 선택</p>
              <span className="text-[10px] text-muted-foreground">{selectedViews.length}개 선택됨</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {VIEW_ANGLE_OPTIONS.map(view => {
                const isSelected = selectedViews.includes(view.id);
                return (
                  <button
                    key={view.id}
                    onClick={() => toggleView(view.id)}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-md border text-left text-[11px] transition-colors',
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'hover:bg-muted border-border text-foreground'
                    )}
                  >
                    <span className="text-base leading-none">{view.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{view.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{view.description}</p>
                    </div>
                    <Checkbox checked={isSelected} className="h-3.5 w-3.5 pointer-events-none" />
                  </button>
                );
              })}
            </div>
            <Button
              size="sm"
              className="w-full h-8 text-xs"
              disabled={generating || selectedViews.length === 0}
              onClick={handleGenerateAiImages}
            >
              {generating ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              {generating ? '생성 중...' : `선택한 ${selectedViews.length}개 뷰 AI 이미지 생성`}
            </Button>
          </div>
        )}

        {/* Generation Progress */}
        {generating && (
          <div className="border rounded-lg p-3 mb-3 bg-primary/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                AI 이미지 생성 중...
              </span>
              <span className="text-muted-foreground">
                {selectedViews.length}개 뷰 생성 요청됨
              </span>
            </div>
            <Progress value={50} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">
              참조 이미지를 분석하여 다각도 제품 이미지를 생성하고 있습니다. 뷰당 약 15-30초 소요됩니다.
            </p>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mb-2">
          AI가 참조 이미지와 분석 데이터를 기반으로 쿼터뷰, 탑뷰, 사이드뷰 등 다각도 이미지를 자동 생성합니다.
        </p>

        {aiGeneratedImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
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
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-1 right-1 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Eye className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed rounded-lg p-4 text-center text-muted-foreground">
            <Camera className="h-5 w-5 mx-auto mb-1 opacity-30" />
            <p className="text-[10px]">
              {showViewSelector
                ? '위에서 뷰 앵글을 선택한 후 생성 버튼을 클릭하세요'
                : '\'뷰 선택\' 버튼을 클릭하여 생성할 각도를 선택하세요'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
