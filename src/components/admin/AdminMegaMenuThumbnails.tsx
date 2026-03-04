import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError, getErrorMessage } from '@/lib/errorUtils';
import CategoryImageUpload from './CategoryImageUpload';
import { ChevronRight, Image as ImageIcon } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number | null;
  image_url: string | null;
  is_active: boolean | null;
}

const AdminMegaMenuThumbnails = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      logError('Fetch categories', error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const mainCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) =>
    categories.filter(c => c.parent_id === parentId).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const handleImageChange = async (categoryId: string, url: string) => {
    setSavingId(categoryId);
    try {
      const { error } = await supabase
        .from('categories')
        .update({ image_url: url })
        .eq('id', categoryId);
      if (error) throw error;
      setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, image_url: url } : c));
      toast.success('썸네일이 저장되었습니다.');
    } catch (error: any) {
      logError('Update category image', error);
      toast.error(getErrorMessage(error));
    } finally {
      setSavingId(null);
    }
  };

  const totalSubs = categories.filter(c => c.parent_id).length;
  const withImage = categories.filter(c => c.parent_id && c.image_url).length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          메가메뉴 썸네일 관리
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          각 하위 카테고리의 썸네일 이미지를 업로드하면 메가 메뉴에 표시됩니다.
        </p>
        {/* Progress */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-xs">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: totalSubs > 0 ? `${(withImage / totalSubs) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-sm text-muted-foreground font-medium">
            {withImage} / {totalSubs} 완료
          </span>
        </div>
      </div>

      {/* Category Groups */}
      {mainCategories.map(main => {
        const subs = getSubcategories(main.id);
        if (subs.length === 0) return null;

        return (
          <div key={main.id} className="border border-border rounded-xl overflow-hidden bg-card">
            {/* Group Header */}
            <div className="px-5 py-4 bg-muted/30 border-b border-border flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">{main.name}</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {subs.filter(s => s.image_url).length}/{subs.length} 이미지
              </span>
            </div>

            {/* Subcategory Grid */}
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {subs.map(sub => (
                <div key={sub.id} className="flex flex-col items-center gap-2">
                  {/* Category Name */}
                  <span className="text-sm font-medium text-foreground text-center leading-tight">
                    {sub.name}
                  </span>

                  {/* Thumbnail Preview & Upload */}
                  <div className="w-full">
                    <CategoryImageUpload
                      imageUrl={sub.image_url || ''}
                      onChange={(url) => handleImageChange(sub.id, url)}
                    />
                  </div>

                  {/* Status indicator */}
                  <div className={`w-2 h-2 rounded-full ${sub.image_url ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {mainCategories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          등록된 카테고리가 없습니다.
        </div>
      )}
    </div>
  );
};

export default AdminMegaMenuThumbnails;
