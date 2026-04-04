import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Upload, Trash2, Video, Image as ImageIcon, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface BannerData {
  id: string;
  video_url: string | null;
  fallback_image_url: string | null;
  main_title: string | null;
  sub_title: string | null;
  animation_type: string | null;
  animation_speed: number | null;
  overlay_opacity: number | null;
  is_active: boolean;
}

const ANIMATION_OPTIONS = [
  { value: 'fade-up', label: '아래에서 위로 (Fade Up)' },
  { value: 'fade', label: '서서히 나타남 (Fade)' },
  { value: 'slide', label: '왼쪽에서 슬라이드 (Slide)' },
  { value: 'zoom', label: '확대 (Zoom)' },
];

const SPEED_OPTIONS = [
  { value: '0.6', label: '빠름 (0.6초)' },
  { value: '1.0', label: '보통 (1.0초)' },
  { value: '1.2', label: '느림 (1.2초)' },
  { value: '1.8', label: '매우 느림 (1.8초)' },
];

const getPreviewAnimation = (type: string, speed: number) => {
  const duration = speed || 1.2;
  switch (type) {
    case 'fade-up':
      return { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration, ease: 'easeOut' } } };
    case 'fade':
      return { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration, ease: 'easeOut' } } };
    case 'slide':
      return { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0, transition: { duration, ease: 'easeOut' } } };
    case 'zoom':
      return { hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1, transition: { duration, ease: 'easeOut' } } };
    default:
      return { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration, ease: 'easeOut' } } };
  }
};

const AdminProductBanner = () => {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const [mainTitle, setMainTitle] = useState('주요 제품');
  const [subTitle, setSubTitle] = useState('');
  const [animationType, setAnimationType] = useState('fade-up');
  const [animationSpeed, setAnimationSpeed] = useState('1.2');
  const [overlayOpacity, setOverlayOpacity] = useState(0.3);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBanner();
  }, []);

  const fetchBanner = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('product_banners')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const b = data as BannerData;
      setBanner(b);
      setMainTitle(b.main_title || '');
      setSubTitle(b.sub_title || '');
      setAnimationType(b.animation_type || 'fade-up');
      setAnimationSpeed(String(b.animation_speed || 1.2));
      setOverlayOpacity(b.overlay_opacity ?? 0.3);
      setVideoUrl(b.video_url);
      setFallbackImageUrl(b.fallback_image_url);
    }
    setIsLoading(false);
  };

  const handleUpload = async (file: File, type: 'video' | 'image') => {
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `product-banners/${type}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(path);

      if (type === 'video') {
        setVideoUrl(urlData.publicUrl);
      } else {
        setFallbackImageUrl(urlData.publicUrl);
      }
      toast.success(`${type === 'video' ? '동영상' : '이미지'}이 업로드되었습니다.`);
    } catch (err: any) {
      toast.error('업로드 실패: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData = {
        main_title: mainTitle,
        sub_title: subTitle,
        animation_type: animationType,
        animation_speed: parseFloat(animationSpeed),
        overlay_opacity: overlayOpacity,
        video_url: videoUrl,
        fallback_image_url: fallbackImageUrl,
      };

      if (banner) {
        const { error } = await supabase
          .from('product_banners')
          .update(updateData)
          .eq('id', banner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_banners')
          .insert([{ ...updateData, is_active: true }]);
        if (error) throw error;
      }
      toast.success('배너 설정이 저장되었습니다.');
      await fetchBanner();
    } catch (err: any) {
      toast.error('저장 실패: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const refreshPreview = () => setPreviewKey(prev => prev + 1);

  const variants = getPreviewAnimation(animationType, parseFloat(animationSpeed));

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">주요제품 메인 배너 관리</h2>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-5 bg-card rounded-xl p-5 border">
          {/* Media Upload */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">미디어</Label>

            {/* Video Upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">배경 동영상</span>
              </div>
              {videoUrl ? (
                <div className="relative rounded-lg overflow-hidden border bg-muted">
                  <video src={videoUrl} className="w-full h-32 object-cover" muted />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => setVideoUrl(null)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-20 border-dashed"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  동영상 업로드 (MP4, WebM)
                </Button>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f, 'video');
                  e.target.value = '';
                }}
              />
            </div>

            {/* Fallback Image */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">대체 이미지 (로딩 전 표시)</span>
              </div>
              {fallbackImageUrl ? (
                <div className="relative rounded-lg overflow-hidden border">
                  <img src={fallbackImageUrl} alt="Fallback" className="w-full h-32 object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => setFallbackImageUrl(null)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-16 border-dashed"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  대체 이미지 업로드
                </Button>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f, 'image');
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {/* Text Fields */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">텍스트</Label>
            <div>
              <Label className="text-sm">메인 타이틀</Label>
              <Input value={mainTitle} onChange={(e) => setMainTitle(e.target.value)} placeholder="주요 제품" />
            </div>
            <div>
              <Label className="text-sm">서브 타이틀</Label>
              <Input value={subTitle} onChange={(e) => setSubTitle(e.target.value)} placeholder="최고의 품질..." />
            </div>
          </div>

          {/* Animation Settings */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">애니메이션 설정</Label>
            <div>
              <Label className="text-sm">애니메이션 종류</Label>
              <Select value={animationType} onValueChange={setAnimationType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANIMATION_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">애니메이션 속도</Label>
              <Select value={animationSpeed} onValueChange={setAnimationSpeed}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPEED_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">오버레이 어두움 ({Math.round(overlayOpacity * 100)}%)</Label>
              <Slider
                value={[overlayOpacity]}
                onValueChange={([v]) => setOverlayOpacity(v)}
                min={0}
                max={0.8}
                step={0.05}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4" /> 실시간 프리뷰
            </Label>
            <Button variant="outline" size="sm" onClick={refreshPreview}>
              애니메이션 재생
            </Button>
          </div>
          <div className="relative w-full h-[400px] rounded-xl overflow-hidden border shadow-lg">
            {/* Fallback Image */}
            {fallbackImageUrl && !videoUrl && (
              <img src={fallbackImageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
            )}

            {/* Video */}
            {videoUrl && (
              <video src={videoUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
            )}

            {/* Gradient fallback */}
            {!videoUrl && !fallbackImageUrl && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40" />
            )}

            {/* Overlay */}
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }} />

            {/* Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center z-10" key={previewKey}>
              {mainTitle && (
                <motion.h2
                  variants={variants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl sm:text-4xl font-black text-white drop-shadow-lg mb-3"
                >
                  {mainTitle}
                </motion.h2>
              )}
              {subTitle && (
                <motion.p
                  variants={variants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.3 }}
                  className="text-sm sm:text-lg text-white/90 drop-shadow-md"
                >
                  {subTitle}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductBanner;
