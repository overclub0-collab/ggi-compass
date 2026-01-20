import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedMainCategory: string;
  selectedSubcategory: string;
  onMainCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onClear: () => void;
}

const CategoryFilter = ({
  categories,
  selectedMainCategory,
  selectedSubcategory,
  onMainCategoryChange,
  onSubcategoryChange,
  onClear,
}: CategoryFilterProps) => {
  const mainCategories = categories.filter(c => !c.parent_id);
  const subcategories = categories.filter(
    c => c.parent_id && mainCategories.find(m => m.id === c.parent_id && m.slug === selectedMainCategory)
  );

  const hasFilter = selectedMainCategory || selectedSubcategory;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="hidden sm:inline">카테고리 필터:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Select value={selectedMainCategory} onValueChange={onMainCategoryChange}>
          <SelectTrigger className="w-[160px] h-9 bg-background">
            <SelectValue placeholder="대분류 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 대분류</SelectItem>
            {mainCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={selectedSubcategory} 
          onValueChange={onSubcategoryChange}
          disabled={!selectedMainCategory || selectedMainCategory === 'all'}
        >
          <SelectTrigger className="w-[160px] h-9 bg-background">
            <SelectValue placeholder="소분류 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 소분류</SelectItem>
            {subcategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-9 px-2"
          >
            <X className="h-4 w-4 mr-1" />
            필터 초기화
          </Button>
        )}
      </div>
    </div>
  );
};

export default CategoryFilter;
