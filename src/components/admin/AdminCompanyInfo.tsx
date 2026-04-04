import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, GripVertical, Video, Upload, X, Sparkles, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import CompanyImageDropzone from './CompanyImageDropzone';

interface CompanySection {
  id: string;
  section_key: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  images: string[] | null;
  video_url: string | null;
  display_order: number;
  is_active: boolean;
  text_animation: string | null;
}

const SECTION_LABELS: Record<string, string> = {
  hero: '메인 배너',
  greeting: '대표 인사말',
  vision: '비전 및 핵심가치',
  history: '회사 연혁',
  certifications: '인증 및 자격',
};

const ANIMATION_OPTIONS = [
  { value: 'none', label: '없음' },
  { value: 'fade-up', label: '페이드 업 (아래→위)' },
  { value: 'fade-down', label: '페이드 다운 (위→아래)' },
  { value: 'fade-left', label: '슬라이드 (왼쪽→오른쪽)' },
  { value: 'fade-right', label: '슬라이드 (오른쪽→왼쪽)' },
  { value: 'zoom-in', label: '줌 인 (확대)' },
  { value: 'typewriter', label: '타이핑 효과' },
  { value: 'blur-in', label: '블러 → 선명' },
  { value: 'bounce-in', label: '바운스 등장' },
  { value: 'stagger', label: '글자 순차 등장' },
];

const getAnimationVariants = (type: string) => {
  const duration = 1.0;
  switch (type) {
    case 'fade-up':
      return { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration } } };
    case 'fade-down':
      return { hidden: { opacity: 0, y: -40 }, visible: { opacity: 1, y: 0, transition: { duration } } };
    case 'fade-left':
      return { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0, transition: { duration } } };
    case 'fade-right':
      return { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0, transition: { duration } } };
    case 'zoom-in':
      return { hidden: { opacity: 0, scale: 0.7 }, visible: { opacity: 1, scale: 1, transition: { duration } } };
    case 'blur-in':
      return { hidden: { opacity: 0, filter: 'blur(12px)' }, visible: { opacity: 1, filter: 'blur(0px)', transition: { duration } } };
    case 'bounce-in':
      return { hidden: { opacity: 0, y: 60, scale: 0.8 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, type: 'spring', bounce: 0.4 } } };
    case 'typewriter':
      return { hidden: { opacity: 0, width: 0 }, visible: { opacity: 1, width: 'auto', transition: { duration: 1.5 } } };
    case 'stagger':
      return { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
    default:
      return { hidden: { opacity: 1 }, visible: { opacity: 1 } };
  }
};

const SectionPreview = ({ section, previewKey }: { section: CompanySection; previewKey: number }) => {
  const isHero = section.section_key === 'hero';
  const animType = section.text_animation || 'none';
  const variants = getAnimationVariants(animType);
  const bgImage = section.images?.[0] || section.image_url;

  if (isHero) {
    return (
      <div className="relative w-full h-[280px] rounded-xl overflow-hidden border shadow-lg">
        {/* Background image */}
        {bgImage && !section.video_url && (
          <img src={bgImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {/* Video */}
        {section.video_url && (
          <video src={section.video_url} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
        )}
        {/* Gradient fallback */}
        {!section.video_url && !bgImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A1931] to-[#1a3a5c]" />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30" />
        {/* Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center z-10" key={previewKey}>
          {section.title && (
            <motion.h2 variants={variants} initial="hidden" animate="visible" className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg mb-3">
              {section.title}
            </motion.h2>
          )}
          {section.content && (
            <motion.p variants={variants} initial="hidden" animate="visible" transition={{ delay: 0.3 }} className="text-sm sm:text-base text-white/90 drop-shadow-md max-w-lg line-clamp-3">
              {section.content}
            </motion.p>
          )}
        </div>
      </div>
    );
  }

  // Non-hero section preview
  return (
    <div className="relative w-full min-h-[200px] rounded-xl overflow-hidden border shadow-lg bg-background p-6" key={previewKey}>
      <div className="flex gap-4">
        {bgImage && (
          <img src={bgImage} alt="Preview" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          {section.title && (
            <motion.h3 variants={variants} initial="hidden" animate="visible" className="text-lg font-bold text-foreground">
              {section.title}
            </motion.h3>
          )}
          {section.content && (
            <motion.p variants={variants} initial="hidden" animate="visible" transition={{ delay: 0.2 }} className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-line">
              {section.content}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminCompanyInfo = () => {
  const [sections, setSections] = useState<CompanySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingVideoId, setUploadingVideoId] = useState<string | null>(null);
  const [previewKeys, setPreviewKeys] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from('company_info')
      .select('*')
      .order('display_order', { ascending: true });
    if (!error && data) setSections(data as unknown as CompanySection[]);
    setIsLoading(false);
  };

  const handleChange = (id: string, field: keyof CompanySection, value: string | boolean) => {
    setSections(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleImagesChange = (id: string, images: string[]) => {
    setSections(prev =>
      prev.map(s => (s.id === id ? { ...s, images, image_url: images[0] || null } : s))
    );
  };

  const refreshPreview = (id: string) => {
    setPreviewKeys(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleVideoUpload = useCallback(async (sectionId: string, file: File) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('MP4, WebM, OGG 동영상만 업로드 가능합니다.');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error('동영상 크기는 500MB 이하여야 합니다.');
      return;
    }

    setUploadingVideoId(sectionId);
    const toastId = toast.loading('동영상 업로드 중... 파일 크기에 따라 시간이 걸릴 수 있습니다.');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `company/video/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      toast.dismiss(toastId);

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      handleChange(sectionId, 'video_url', publicUrl);
      toast.success('동영상이 업로드되었습니다.');
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error('동영상 업로드 실패: ' + error.message);
    } finally {
      setUploadingVideoId(null);
    }
  }, []);

  const handleSave = async (section: CompanySection) => {
    setSavingId(section.id);
    const { error } = await supabase
      .from('company_info')
      .update({
        title: section.title,
        content: section.content,
        image_url: section.images?.[0] || section.image_url,
        images: section.images || [],
        video_url: section.video_url || null,
        is_active: section.is_active,
        display_order: section.display_order,
        text_animation: section.text_animation || 'none',
      } as any)
      .eq('id', section.id);

    if (error) {
      toast.error('저장 실패: ' + error.message);
    } else {
      toast.success(`"${SECTION_LABELS[section.section_key] || section.section_key}" 섹션이 저장되었습니다.`);
    }
    setSavingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">기업소개 페이지 관리</h2>
        <p className="text-sm text-muted-foreground mt-1">
          각 섹션의 제목, 내용, 이미지, 동영상, 애니메이션을 수정하고 저장하세요.
        </p>
      </div>

      {sections.map((section) => (
        <div
          key={section.id}
          className="bg-card border rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {SECTION_LABELS[section.section_key] || section.section_key}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`active-${section.id}`} className="text-xs text-muted-foreground">활성</Label>
              <Switch
                id={`active-${section.id}`}
                checked={section.is_active}
                onCheckedChange={(v) => handleChange(section.id, 'is_active', v)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Settings Panel */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium">제목</Label>
                <Input
                  value={section.title || ''}
                  onChange={(e) => handleChange(section.id, 'title', e.target.value)}
                  placeholder="섹션 제목"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-medium">내용</Label>
                <Textarea
                  value={section.content || ''}
                  onChange={(e) => handleChange(section.id, 'content', e.target.value)}
                  placeholder="섹션 내용을 입력하세요..."
                  rows={4}
                  className="mt-1 text-sm"
                />
              </div>

              {/* Text Animation Selector */}
              <div>
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  텍스트 애니메이션 효과
                </Label>
                <Select
                  value={section.text_animation || 'none'}
                  onValueChange={(v) => handleChange(section.id, 'text_animation' as any, v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="애니메이션 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANIMATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Video Upload - hero only */}
              {section.section_key === 'hero' && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5" />
                    배경 동영상
                  </Label>

                  {section.video_url && (
                    <div className="relative rounded-lg overflow-hidden border bg-muted">
                      <video
                        src={section.video_url}
                        className="w-full max-h-32 object-cover"
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => handleChange(section.id, 'video_url', '')}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        value={section.video_url || ''}
                        onChange={(e) => handleChange(section.id, 'video_url', e.target.value)}
                        placeholder="URL을 직접 입력하거나 파일을 업로드하세요"
                        className="text-xs"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleVideoUpload(section.id, file);
                          e.target.value = '';
                        }}
                        className="hidden"
                        id={`video-upload-${section.id}`}
                        disabled={uploadingVideoId === section.id}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        asChild
                        disabled={uploadingVideoId === section.id}
                      >
                        <label htmlFor={`video-upload-${section.id}`} className="cursor-pointer">
                          {uploadingVideoId === section.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                          ) : (
                            <>
                              <Upload className="h-3.5 w-3.5 mr-1" />
                              업로드
                            </>
                          )}
                        </label>
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    MP4, WebM, OGG / 500MB 이하
                  </p>
                </div>
              )}

              <div>
                <Label className="text-xs font-medium">이미지</Label>
                <div className="mt-1">
                  <CompanyImageDropzone
                    images={section.images || (section.image_url ? [section.image_url] : [])}
                    onChange={(imgs) => handleImagesChange(section.id, imgs)}
                    maxImages={10}
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Panel */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Eye className="h-4 w-4" /> 실시간 프리뷰
                </Label>
                <Button variant="outline" size="sm" onClick={() => refreshPreview(section.id)}>
                  애니메이션 재생
                </Button>
              </div>
              <SectionPreview section={section} previewKey={previewKeys[section.id] || 0} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => handleSave(section)}
              disabled={savingId === section.id}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {savingId === section.id ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminCompanyInfo;
