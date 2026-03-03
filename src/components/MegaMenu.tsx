import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  description?: string;
  image_url?: string | null;
}

interface MegaMenuProps {
  categories: Category[];
  onClose: () => void;
}

// Placeholder images mapped by main category slug
const categoryImages: Record<string, string> = {
  educational: '/placeholder.svg',
  office: '/placeholder.svg',
  chairs: '/placeholder.svg',
  'dining-table': '/placeholder.svg',
  'lab-bench': '/placeholder.svg',
  military: '/placeholder.svg',
};

export const MegaMenu = ({ categories, onClose }: MegaMenuProps) => {
  const mainCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) =>
    categories.filter(c => c.parent_id === parentId).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const [activeCategory, setActiveCategory] = useState<string | null>(
    mainCategories[0]?.id ?? null
  );

  const activeMain = mainCategories.find(c => c.id === activeCategory);
  const subcategories = activeCategory ? getSubcategories(activeCategory) : [];

  const handleCategoryHover = useCallback((id: string) => {
    setActiveCategory(id);
  }, []);

  return (
    <div className="absolute top-full left-0 right-0 w-screen pt-0" style={{ marginLeft: 'calc(-50vw + 50%)' }}>
      {/* Invisible bridge to prevent hover gap */}
      <div className="h-2" />
      
      <div 
        className="bg-white border-t border-border shadow-xl animate-in fade-in slide-in-from-top-2 duration-300"
        style={{ boxShadow: '0 20px 60px -10px rgba(0,0,0,0.12)' }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Top: Main categories as horizontal tabs */}
          <div className="flex items-center border-b border-border/60 px-6">
            {mainCategories.map((cat) => (
              <button
                key={cat.id}
                onMouseEnter={() => handleCategoryHover(cat.id)}
                onClick={() => handleCategoryHover(cat.id)}
                className={cn(
                  "relative px-5 py-4 text-sm font-medium transition-colors whitespace-nowrap",
                  activeCategory === cat.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.name}
                {/* Active indicator line */}
                {activeCategory === cat.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full transition-all" />
                )}
              </button>
            ))}
          </div>

          {/* Bottom: Subcategories with thumbnails */}
          <div className="px-6 py-8">
            {activeMain && (
              <div className="animate-in fade-in duration-200">
                {/* Category header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-foreground">
                    {activeMain.name}
                  </h3>
                  <Link
                    to={`/product/${activeMain.slug}`}
                    onClick={onClose}
                    className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                  >
                    {activeMain.name} 전체 보기
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Subcategory grid with thumbnails */}
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/product/${activeMain.slug}/${sub.slug}`}
                      onClick={onClose}
                      className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-muted/50 transition-all duration-200"
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-muted/80 overflow-hidden flex items-center justify-center group-hover:shadow-md transition-shadow duration-200">
                        <img
                          src={sub.image_url || '/placeholder.svg'}
                          alt={sub.name}
                          className="w-10 h-10 object-contain opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200"
                          loading="lazy"
                        />
                      </div>
                      {/* Label */}
                      <span className="text-sm text-muted-foreground group-hover:text-foreground font-medium text-center transition-colors leading-tight">
                        {sub.name}
                      </span>
                    </Link>
                  ))}
                </div>

                {/* Empty state */}
                {subcategories.length === 0 && (
                  <p className="text-muted-foreground text-sm py-4">
                    하위 카테고리가 없습니다.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer: View all products */}
          <div className="border-t border-border/60 px-6 py-4 flex items-center justify-between">
            <Link
              to="/product/all"
              onClick={onClose}
              className="text-sm text-accent font-semibold hover:text-primary transition-colors flex items-center gap-1"
            >
              전체 제품 보기
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to="/catalogs"
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              카탈로그 다운로드 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
