import { useState, useMemo } from 'react';
import { Monitor, Armchair, Archive, Square, BookOpen, Sofa, Loader2, FlaskConical, UtensilsCrossed, Shield, ChevronLeft, ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FurnitureItem } from '@/types/planner';
import { usePlannerCategories, usePlannerProducts } from '@/hooks/usePlannerProducts';

interface FurnitureSidebarProps {
  onDragStart: (furniture: FurnitureItem) => void;
}

const ITEMS_PER_PAGE = 9;

const categoryIcons: Record<string, React.ElementType> = {
  educational: BookOpen,
  office: Monitor,
  chairs: Armchair,
  'dining-table': UtensilsCrossed,
  'lab-bench': FlaskConical,
  military: Shield,
  desk: Monitor,
  chair: Armchair,
  storage: Archive,
  table: Square,
  sofa: Sofa,
  shelf: BookOpen,
};

export const FurnitureSidebar = ({ onDragStart }: FurnitureSidebarProps) => {
  const { data: categories, isLoading: catLoading } = usePlannerCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedMainId, setExpandedMainId] = useState<string | null>(null);
  const { data: products, isLoading: prodLoading } = usePlannerProducts(selectedCategoryId);
  const [currentPage, setCurrentPage] = useState(0);

  // Auto-expand first main category
  if (categories && categories.length > 0 && !expandedMainId) {
    setExpandedMainId(categories[0].id);
    if (categories[0].children.length > 0) {
      setSelectedCategoryId(categories[0].children[0].id);
    } else {
      setSelectedCategoryId(categories[0].id);
    }
  }

  const totalPages = useMemo(() => {
    if (!products) return 0;
    return Math.ceil(products.length / ITEMS_PER_PAGE);
  }, [products]);

  const pagedProducts = useMemo(() => {
    if (!products) return [];
    const start = currentPage * ITEMS_PER_PAGE;
    return products.slice(start, start + ITEMS_PER_PAGE);
  }, [products, currentPage]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId);
    setCurrentPage(0);
  };

  const handleToggleMain = (mainId: string) => {
    setExpandedMainId(prev => prev === mainId ? null : mainId);
  };

  const handleDragStart = (e: React.DragEvent, furniture: FurnitureItem) => {
    e.dataTransfer.setData('furniture', JSON.stringify(furniture));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(furniture);
  };

  return (
    <div className="w-[280px] flex flex-col h-full bg-background/60 backdrop-blur-xl border-r border-border/40 shadow-lg">
      {/* Header — static, no animation */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground/70">
          제품 카테고리
        </h2>
      </div>

      {/* Category Tree */}
      <div className="border-b border-border/30">
        {catLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-[260px]">
            <div className="px-2 pb-2 space-y-0.5">
              {(categories || []).map((mainCat) => {
                const Icon = categoryIcons[mainCat.slug] || Archive;
                const isExpanded = expandedMainId === mainCat.id;
                const isMainSelected = selectedCategoryId === mainCat.id;
                const hasChildren = mainCat.children.length > 0;

                return (
                  <div key={mainCat.id}>
                    {/* Main Category — static button, no whileHover animation */}
                    <button
                      onClick={() => {
                        handleToggleMain(mainCat.id);
                        if (!hasChildren) handleCategoryChange(mainCat.id);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative",
                        isMainSelected && !hasChildren
                          ? "bg-primary text-primary-foreground font-bold shadow-md"
                          : "text-foreground hover:bg-accent/10 hover:translate-x-1"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        isMainSelected && !hasChildren
                          ? "bg-primary-foreground/20"
                          : "bg-muted/60 group-hover:bg-accent/20"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-left truncate font-medium">{mainCat.name}</span>
                      {hasChildren && (
                        <ChevronDown className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )} />
                      )}
                    </button>

                    {/* Subcategories — CSS transition instead of framer-motion */}
                    {isExpanded && hasChildren && (
                      <div className="ml-5 pl-3 border-l-2 border-primary/15 space-y-0.5 mt-1 mb-1.5 animate-in slide-in-from-top-2 duration-200">
                        <button
                          onClick={() => handleCategoryChange(mainCat.id)}
                          className={cn(
                            "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all duration-150 hover:translate-x-1",
                            selectedCategoryId === mainCat.id
                              ? "bg-primary text-primary-foreground font-bold"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                          )}
                        >
                          전체보기
                        </button>
                        {mainCat.children.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleCategoryChange(sub.id)}
                            className={cn(
                              "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all duration-150 hover:translate-x-1",
                              selectedCategoryId === sub.id
                                ? "bg-primary text-primary-foreground font-bold"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                            )}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Furniture List — static cards, no motion animations */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {prodLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (products || []).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              이 카테고리에 등록된 제품이 없습니다
            </p>
          ) : (
            <>
              <p className="text-[10px] text-muted-foreground mb-1">
                총 {products!.length}개 · {currentPage + 1}/{totalPages} 페이지
              </p>

              {pagedProducts.map((furniture) => (
                <div
                  key={furniture.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, furniture)}
                  className={cn(
                    "group cursor-grab active:cursor-grabbing relative",
                    "bg-background/80 backdrop-blur-sm border border-border/40 rounded-xl p-3",
                    "hover:border-primary/40 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-200"
                  )}
                >
                  {/* Drag handle hint — static */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity">
                    <GripVertical className="h-3.5 w-3.5" />
                  </div>

                  {furniture.thumbnail ? (
                    <img
                      src={furniture.thumbnail}
                      alt={furniture.name}
                      className="w-full aspect-[4/3] rounded-lg mb-2 object-cover bg-muted"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full aspect-[4/3] rounded-lg mb-2 flex items-center justify-center relative overflow-hidden"
                      style={{ backgroundColor: furniture.color || 'hsl(var(--muted))' }}
                    >
                      <div
                        className="border-2 border-foreground/20 rounded"
                        style={{
                          width: `${Math.min(80, (furniture.width / 20))}%`,
                          height: `${Math.min(80, (furniture.height / 15))}%`,
                          backgroundColor: furniture.color,
                          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
                        }}
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {furniture.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {furniture.width} × {furniture.height} × {furniture.depth || '—'} mm
                  </p>
                  {furniture.price > 0 && (
                    <p className="text-sm font-bold text-accent mt-1">
                      ₩{furniture.price.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Pagination — static */}
      {totalPages > 1 && (
        <div className="p-2 border-t border-border/30 flex items-center justify-between bg-background/50 backdrop-blur-sm">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={cn(
                  "w-6 h-6 rounded-lg text-xs font-medium transition-all",
                  i === currentPage
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
