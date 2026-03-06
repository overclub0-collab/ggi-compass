import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Upload, Loader2, Eye, Image as ImageIcon, X } from 'lucide-react';

interface CategoryShowcase {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
}

export default function AdminHomepageManager() {
  const [categories, setCategories] = useState<CategoryShowcase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, { description: string; image_url: string }>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, image_url, display_order')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      toast.error('카테고리 불러오기 실패');
    } else {
      setCategories(data || []);
      const initial: Record<string, { description: string; image_url: string }> = {};
      (data || []).forEach(cat => {
        initial[cat.id] = {
          description: cat.description || '',
          image_url: cat.image_url || '',
        };
      });
      setEditData(initial);
    }
    setIsLoading(false);
  };

  const handleImageUpload = async (categoryId: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `homepage/${categoryId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error('이미지 업로드 실패: ' + uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
    setEditData(prev => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], image_url: urlData.publicUrl },
    }));
    toast.success('이미지가 업로드되었습니다.');
  };

  const handleSave = async (categoryId: string) => {
    setSaving(categoryId);
    const data = editData[categoryId];
    if (!data) return;

    const { error } = await supabase
      .from('categories')
      .update({
        description: data.description || null,
        image_url: data.image_url || null,
      })
      .eq('id', categoryId);

    if (error) {
      toast.error('저장 실패: ' + error.message);
    } else {
      toast.success('저장되었습니다.');
      fetchCategories();
    }
    setSaving(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">메인페이지 제품소개 관리</h2>
        <p className="text-sm text-muted-foreground mt-1">
          홈 화면에 표시되는 카테고리별 이미지와 설명을 수정할 수 있습니다.
        </p>
      </div>

      {/* Preview hint */}
      <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg text-sm text-accent">
        <Eye className="h-4 w-4 shrink-0" />
        변경 사항은 저장 후 메인 페이지에 즉시 반영됩니다.
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {categories.map((cat) => {
          const data = editData[cat.id] || { description: '', image_url: '' };
          return (
            <Card key={cat.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  {cat.name}
                  <span className="text-xs font-normal text-muted-foreground ml-auto">
                    순서: {cat.display_order}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Preview & Upload */}
                <div>
                  <Label className="text-sm font-medium">대표 이미지</Label>
                  <div className="mt-2 relative group">
                    {data.image_url ? (
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border bg-muted">
                        <img
                          src={data.image_url}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                        />
                        <button
                          onClick={() => setEditData(prev => ({
                            ...prev,
                            [cat.id]: { ...prev[cat.id], image_url: '' },
                          }))}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-2">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-xs text-muted-foreground">이미지를 업로드하세요</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(cat.id, file);
                        }}
                      />
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <span>
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          이미지 업로드
                        </span>
                      </Button>
                    </label>
                  </div>
                  {/* Direct URL input */}
                  <Input
                    placeholder="또는 이미지 URL 직접 입력..."
                    value={data.image_url}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      [cat.id]: { ...prev[cat.id], image_url: e.target.value },
                    }))}
                    className="mt-2 text-xs h-8"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm font-medium">설명</Label>
                  <Textarea
                    placeholder="이 카테고리의 설명을 입력하세요..."
                    value={data.description}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      [cat.id]: { ...prev[cat.id], description: e.target.value },
                    }))}
                    rows={2}
                    className="mt-1 text-sm"
                  />
                </div>

                {/* Save */}
                <Button
                  onClick={() => handleSave(cat.id)}
                  disabled={saving === cat.id}
                  className="w-full"
                  size="sm"
                >
                  {saving === cat.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  저장
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
