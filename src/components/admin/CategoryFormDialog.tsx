import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Folder, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  description?: string;
  image_url?: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  parent_id: string;
  display_order: number;
  description: string;
  image_url: string;
}

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: Category | null;
  categories: Category[];
  initialParentId: string | null;
  onSave: (data: CategoryFormData) => void;
}

const CategoryFormDialog = ({
  open,
  onOpenChange,
  editingCategory,
  categories,
  initialParentId,
  onSave,
}: CategoryFormDialogProps) => {
  const mainCategories = categories.filter(c => !c.parent_id);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    parent_id: '',
    display_order: 0,
    description: '',
    image_url: '',
  });

  const isSubcategory = !!formData.parent_id;
  const isEditing = !!editingCategory;
  const parentName = mainCategories.find(c => c.id === formData.parent_id)?.name;

  useEffect(() => {
    if (!open) return;
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        slug: editingCategory.slug,
        parent_id: editingCategory.parent_id || '',
        display_order: editingCategory.display_order,
        description: editingCategory.description || '',
        image_url: editingCategory.image_url || '',
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        parent_id: initialParentId || '',
        display_order: 0,
        description: '',
        image_url: '',
      });
    }
  }, [editingCategory, initialParentId, open]);

  const handleNameChange = (name: string) => {
    const autoSlug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣-]/g, '');
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === prev.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣-]/g, '')
        ? autoSlug
        : prev.slug,
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    if (isSubcategory && !formData.parent_id) return;
    onSave(formData);
  };

  // Determine title & description
  const dialogTitle = isEditing
    ? (isSubcategory ? '소분류 수정' : '대분류 수정')
    : (isSubcategory ? '소분류 추가' : '대분류 추가');

  const dialogDesc = isEditing
    ? undefined
    : isSubcategory && parentName
      ? `"${parentName}" 아래에 소분류를 추가합니다`
      : isSubcategory
        ? '상위 대분류를 선택한 후 소분류를 추가합니다'
        : '최상위 카테고리를 추가합니다 (예: 교육용가구, 사무용가구)';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {isSubcategory ? (
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent">
                <Tag className="h-4 w-4 text-accent-foreground" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                <Folder className="h-4 w-4 text-primary" />
              </div>
            )}
            {dialogTitle}
          </DialogTitle>
          {dialogDesc && (
            <DialogDescription className="text-xs">
              {dialogDesc}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* For subcategory: show parent selector */}
          {isSubcategory && !isEditing && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">상위 대분류</Label>
              <Select
                value={formData.parent_id}
                onValueChange={(val) => setFormData(prev => ({ ...prev, parent_id: val }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="대분류 선택" />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Editing subcategory: show parent as read-only */}
          {isSubcategory && isEditing && parentName && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-sm">
              <Folder className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">상위:</span>
              <span className="font-medium">{parentName}</span>
            </div>
          )}

          {/* Category Name - main input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              {isSubcategory ? '소분류명' : '대분류명'}
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={isSubcategory ? '예: 칠판보조장, 수강용테이블' : '예: 교육용가구, 사무용가구'}
              className="h-11 text-base"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {/* Slug - small, secondary */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">URL 슬러그 (자동생성)</Label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="자동 생성"
              className="h-8 text-xs font-mono text-muted-foreground"
            />
          </div>

          {/* Display order */}
          <div className="flex items-center gap-3">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">표시 순서</Label>
            <Input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData(prev => ({ ...prev, display_order: Number(e.target.value) }))}
              className="h-8 w-20 text-xs"
            />
          </div>

          {/* Save button */}
          <Button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || (isSubcategory && !formData.parent_id)}
            className="w-full min-h-[44px] text-sm"
          >
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? '수정 완료' : isSubcategory ? '소분류 추가' : '대분류 추가'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryFormDialog;
