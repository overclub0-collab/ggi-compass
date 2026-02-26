import { useState, useMemo } from 'react';
import { Monitor, Armchair, Archive, Square, BookOpen, Sofa, Loader2, FlaskConical, UtensilsCrossed, Shield, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';
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
    if (expandedMainId === mainId) {
      setExpandedMainId(null);
    } else {
      setExpandedMainId(mainId);
    }
  };

  const handleDragStart = (e: React.DragEvent, furniture: FurnitureItem) => {
    e.dataTransfer.setData('furniture', JSON.stringify(furniture));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(furniture);
  };

  return (
    <div className="w-72 bg-card border-r border-border flex flex-col h-full">
      {/* Category Tree */}
      <div className="border-b border-border">
        <div className="p-3 pb-2">
          <h2 className="text-sm font-bold text-primary flex items-center gap-1.5">
            <FolderOpen className="h-4 w-4" />
            제품 카테고리
          </h2>
        </div>
        {catLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-[240px]">
            <div className="px-2 pb-2 space-y-0.5">
              {(categories || []).map((mainCat) => {
                const Icon = categoryIcons[mainCat.slug] || Archive;
                const isExpanded = expandedMainId === mainCat.id;
                const isMainSelected = selectedCategoryId === mainCat.id;
                const hasChildren = mainCat.children.length > 0;

                return (
                  <div key={mainCat.id}>
                    {/* Main Category */}
                    <button
                      onClick={() => {
                        handleToggleMain(mainCat.id);
                        if (!hasChildren) {
                          handleCategoryChange(mainCat.id);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                        "hover:bg-accent/20",
                        isMainSelected && !hasChildren
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left truncate font-medium">{mainCat.name}</span>
                      {hasChildren && (
                        isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>

                    {/* Subcategories */}
                    {isExpanded && hasChildren && (
                      <div className="ml-5 pl-3 border-l-2 border-border space-y-0.5 mt-0.5 mb-1">
                        {/* All in this main category */}
                        <button
                          onClick={() => handleCategoryChange(mainCat.id)}
                          className={cn(
                            "w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors",
                            selectedCategoryId === mainCat.id
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          전체보기
                        </button>
                        {mainCat.children.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleCategoryChange(sub.id)}
                            className={cn(
                              "w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors",
                              selectedCategoryId === sub.id
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
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

      {/* Furniture List */}
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
                    "group cursor-grab active:cursor-grabbing",
                    "bg-background border border-border rounded-lg p-3",
                    "hover:border-primary hover:shadow-md transition-all"
                  )}
                >
                  {furniture.thumbnail ? (
                    <img
                      src={furniture.thumbnail}
                      alt={furniture.name}
                      className="w-full aspect-[4/3] rounded mb-2 object-cover bg-muted"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full aspect-[4/3] rounded mb-2 flex items-center justify-center relative overflow-hidden"
                      style={{ backgroundColor: furniture.color || 'hsl(var(--muted))' }}
                    >
                      <div
                        className="border-2 border-foreground/30 rounded-sm"
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
                  <p className="text-xs text-muted-foreground">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-2 border-t border-border flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={cn(
                  "w-6 h-6 rounded text-xs font-medium transition-colors",
                  i === currentPage
                    ? "bg-primary text-primary-foreground"
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
            className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
