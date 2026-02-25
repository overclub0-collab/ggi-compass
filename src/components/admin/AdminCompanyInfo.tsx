import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, Image as ImageIcon, GripVertical } from 'lucide-react';

interface CompanySection {
  id: string;
  section_key: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  hero: '메인 배너',
  greeting: '대표 인사말',
  vision: '비전 및 핵심가치',
  history: '회사 연혁',
  certifications: '인증 및 자격',
};

const AdminCompanyInfo = () => {
  const [sections, setSections] = useState<CompanySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from('company_info')
      .select('*')
      .order('display_order', { ascending: true });
    if (!error && data) setSections(data as CompanySection[]);
    setIsLoading(false);
  };

  const handleChange = (id: string, field: keyof CompanySection, value: string | boolean) => {
    setSections(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async (section: CompanySection) => {
    setSavingId(section.id);
    const { error } = await supabase
      .from('company_info')
      .update({
        title: section.title,
        content: section.content,
        image_url: section.image_url,
        is_active: section.is_active,
        display_order: section.display_order,
      })
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
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">기업소개 페이지 관리</h2>
        <p className="text-sm text-muted-foreground mt-1">
          각 섹션의 제목, 내용, 이미지를 수정하고 저장하세요. 변경사항은 즉시 기업소개 페이지에 반영됩니다.
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
                rows={5}
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">이미지 URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={section.image_url || ''}
                  onChange={(e) => handleChange(section.id, 'image_url', e.target.value)}
                  placeholder="https://..."
                  className="flex-1"
                />
                {section.image_url && (
                  <div className="w-12 h-12 rounded-lg border overflow-hidden flex-shrink-0">
                    <img src={section.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
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
