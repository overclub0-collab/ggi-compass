import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, FolderOpen, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface CategoryTreeProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category | null) => void;
  onAddProduct: (category: Category) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onAddCategory: (parentId: string | null) => void;
  onProductDrop: (productId: string, targetCategory: Category) => void;
}

const CategoryTree = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onAddProduct,
  onEditCategory,
  onDeleteCategory,
  onAddCategory,
  onProductDrop,
}: CategoryTreeProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

  const mainCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => 
    categories.filter(c => c.parent_id === parentId).sort((a, b) => a.display_order - b.display_order);

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCategory(categoryId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCategory(null);
  };

  const handleDrop = (e: React.DragEvent, category: Category) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCategory(null);
    
    const productId = e.dataTransfer.getData('productId');
    if (productId) {
      onProductDrop(productId, category);
    }
  };

  const renderCategory = (category: Category, isSubcategory: boolean = false) => {
    const subcategories = getSubcategories(category.id);
    const hasSubcategories = subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategory?.id === category.id;
    const isDragOver = dragOverCategory === category.id;

    return (
      <div key={category.id} className={cn("select-none", isSubcategory && "ml-4")}>
        <div
          className={cn(
            "group flex items-center gap-1 py-2 px-2 rounded-lg cursor-pointer transition-all duration-200",
            isSelected && "bg-primary/10 border border-primary/30",
            !isSelected && "hover:bg-muted/50",
            isDragOver && "bg-primary/20 ring-2 ring-primary ring-offset-1"
          )}
          onClick={() => onSelectCategory(category)}
          onDragOver={(e) => handleDragOver(e, category.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, category)}
        >
          {/* Expand/Collapse Button */}
          {hasSubcategories ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(category.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          {/* Folder Icon */}
          {isExpanded || isSelected ? (
            <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}

          {/* Category Name */}
          <span className={cn(
            "flex-1 text-sm truncate",
            isSelected && "font-medium text-primary",
            !isSelected && "text-foreground"
          )}>
            {category.name}
          </span>

          {/* Action Buttons - visible on hover */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onAddProduct(category);
              }}
              title="이 카테고리에 제품 추가"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onEditCategory(category);
              }}
              title="카테고리 수정"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCategory(category);
              }}
              title="카테고리 삭제"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Subcategories */}
        {hasSubcategories && isExpanded && (
          <div className="border-l-2 border-muted ml-4 mt-1">
            {subcategories.map(subcat => renderCategory(subcat, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b">
        <h3 className="font-semibold text-sm">카테고리</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onAddCategory(null)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          대분류 추가
        </Button>
      </div>

      {/* All Products Option */}
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer transition-colors",
          !selectedCategory && "bg-primary/10 border border-primary/30",
          selectedCategory && "hover:bg-muted/50"
        )}
        onClick={() => onSelectCategory(null)}
      >
        <div className="w-6" />
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span className={cn(
          "text-sm",
          !selectedCategory && "font-medium text-primary"
        )}>
          전체 제품
        </span>
      </div>

      {/* Category Tree */}
      <div className="space-y-1">
        {mainCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            등록된 카테고리가 없습니다
          </p>
        ) : (
          mainCategories
            .sort((a, b) => a.display_order - b.display_order)
            .map(cat => renderCategory(cat))
        )}
      </div>

      {/* Help Text */}
      <div className="px-2 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          💡 제품을 카테고리로 드래그하여 이동할 수 있습니다
        </p>
      </div>
    </div>
  );
};

export default CategoryTree;
