import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, X, Folder, FolderOpen, Tag } from 'lucide-react';
import CategoryImageUpload from '@/components/admin/CategoryImageUpload';
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

  // Determine type: 'main' or 'sub'
  const categoryType = formData.parent_id ? 'sub' : 'main';

  useEffect(() => {
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

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === generateSlug(prev.name)
        ? generateSlug(name)
        : prev.slug,
    }));
  };

  const generateSlug = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/[가-힣]+/g, (match) => match) // keep Korean
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9가-힣-]/g, '')
      || '';
  };

  const handleTypeChange = (type: 'main' | 'sub') => {
    if (type === 'main') {
      setFormData(prev => ({ ...prev, parent_id: '' }));
    } else {
      // Default to first main category
      setFormData(prev => ({
        ...prev,
        parent_id: mainCategories[0]?.id || '',
      }));
    }
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  const isEditing = !!editingCategory;
  const parentName = mainCategories.find(c => c.id === formData.parent_id)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {categoryType === 'main' ? (
              <Folder className="h-5 w-5 text-primary" />
            ) : (
              <Tag className="h-5 w-5 text-primary" />
            )}
            {isEditing ? '카테고리 수정' : '새 카테고리 추가'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Category Type Selector - only for new categories */}
          {!isEditing && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">카테고리 유형</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('main')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    categoryType === 'main'
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <Folder className={cn(
                    "h-8 w-8",
                    categoryType === 'main' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="text-center">
                    <p className={cn(
                      "font-semibold text-sm",
                      categoryType === 'main' ? "text-primary" : "text-foreground"
                    )}>대분류</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      최상위 카테고리
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('sub')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    categoryType === 'sub'
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-muted hover:border-muted-foreground/30",
                    mainCategories.length === 0 && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={mainCategories.length === 0}
                >
                  <Tag className={cn(
                    "h-8 w-8",
                    categoryType === 'sub' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="text-center">
                    <p className={cn(
                      "font-semibold text-sm",
                      categoryType === 'sub' ? "text-primary" : "text-foreground"
                    )}>소분류</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      대분류 하위 항목
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Parent category selector for subcategory */}
          {categoryType === 'sub' && (
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                상위 대분류 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.parent_id}
                onValueChange={(val) => setFormData(prev => ({ ...prev, parent_id: val }))}
              >
                <SelectTrigger className="h-11 bg-background">
                  <SelectValue placeholder="대분류를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Info banner */}
          {!isEditing && (
            <div className={cn(
              "rounded-lg px-3 py-2 text-xs",
              categoryType === 'main'
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            )}>
              {categoryType === 'main'
                ? '💡 대분류는 제품의 최상위 분류입니다. (예: 교육용가구, 사무용가구)'
                : parentName
                  ? `💡 "${parentName}" 아래에 소분류가 생성됩니다.`
                  : '💡 소분류를 만들려면 먼저 상위 대분류를 선택하세요.'
              }
            </div>
          )}

          {/* Category Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              카테고리명 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={categoryType === 'main' ? '예: 교육용가구' : '예: 칠판보조장'}
              className="h-11"
              autoFocus
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">
              슬러그 (URL용, 자동생성)
            </Label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              placeholder="자동 생성됩니다"
              className="h-9 text-sm font-mono text-muted-foreground"
            />
          </div>

          {/* Description - collapsed by default */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">설명 (선택)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="카테고리에 대한 간단한 설명"
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Thumbnail */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">메가메뉴 썸네일 (선택)</Label>
            <CategoryImageUpload
              imageUrl={formData.image_url}
              onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
            />
          </div>

          {/* Display Order */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">표시 순서</Label>
            <Input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData(prev => ({ ...prev, display_order: Number(e.target.value) }))}
              className="h-9 w-24"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-h-[44px]"
            >
              <X className="mr-2 h-4 w-4" />
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || (categoryType === 'sub' && !formData.parent_id)}
              className="min-h-[44px]"
            >
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? '수정' : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryFormDialog;
