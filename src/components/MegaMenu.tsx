import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
      {/* Invisible bridge */}
      <div className="h-2" />
      
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="bg-white/95 backdrop-blur-xl border-t border-border shadow-2xl"
        style={{ boxShadow: '0 25px 80px -15px rgba(0,0,0,0.15)' }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Top: Main categories as horizontal tabs */}
          <div className="flex items-center border-b border-border/60 px-6">
            {mainCategories.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
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
                {activeCategory === cat.id && (
                  <motion.span
                    layoutId="mega-tab-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Bottom: Subcategories with thumbnails */}
          <div className="px-6 py-8">
            <AnimatePresence mode="wait">
              {activeMain && (
                <motion.div
                  key={activeMain.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
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
                    {subcategories.map((sub, idx) => (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.25 }}
                      >
                        <Link
                          to={`/product/${activeMain.slug}/${sub.slug}`}
                          onClick={onClose}
                          className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-muted/50 transition-all duration-200"
                        >
                          {/* Thumbnail */}
                          <div className="w-16 h-16 rounded-xl bg-muted/80 overflow-hidden flex items-center justify-center group-hover:shadow-md transition-all duration-200 group-hover:scale-105">
                            <img
                              src={sub.image_url || '/placeholder.svg'}
                              alt={sub.name}
                              className="w-12 h-12 object-contain opacity-60 group-hover:opacity-100 transition-all duration-200"
                              loading="lazy"
                            />
                          </div>
                          {/* Label */}
                          <span className="text-sm text-muted-foreground group-hover:text-foreground font-medium text-center transition-colors leading-tight">
                            {sub.name}
                          </span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {subcategories.length === 0 && (
                    <p className="text-muted-foreground text-sm py-4">
                      하위 카테고리가 없습니다.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-border/60 px-6 py-4 flex items-center justify-between">
            <Link
              to="/product/all"
              onClick={onClose}
              className="text-sm text-accent-foreground font-semibold hover:text-primary transition-colors flex items-center gap-1"
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
      </motion.div>
    </div>
  );
};
