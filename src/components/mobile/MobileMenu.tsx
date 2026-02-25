import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Home, Grid3X3, FileText, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  description?: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onScrollToSection: (id: string) => void;
}

export const MobileMenu = ({ 
  isOpen, 
  onClose, 
  categories, 
  onScrollToSection 
}: MobileMenuProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const mainCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => 
    categories.filter(c => c.parent_id === parentId);

  const handleScrollToSection = (id: string) => {
    onScrollToSection(id);
    onClose();
  };

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="text-left text-xl font-bold text-foreground">
            메뉴
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <nav className="p-4 space-y-1">
            {/* 기업소개 */}
            <Link
              to="/about"
              onClick={handleLinkClick}
              className="w-full flex items-center gap-4 text-foreground hover:text-primary hover:bg-muted transition-colors py-4 px-4 rounded-xl text-lg font-medium"
            >
              <Home className="h-5 w-5 text-primary" />
              기업소개
            </Link>

            {/* 나라장터/조달 */}
            <a
              href="https://shop.g2b.go.kr/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-4 text-foreground hover:text-primary hover:bg-muted transition-colors py-4 px-4 rounded-xl text-lg font-medium"
            >
              <FileText className="h-5 w-5 text-primary" />
              나라장터/조달
            </a>

            {/* 주요제품 - Collapsible */}
            <Collapsible
              open={expandedCategory === 'products'}
              onOpenChange={(open) => setExpandedCategory(open ? 'products' : null)}
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between text-foreground hover:text-primary hover:bg-muted transition-colors py-4 px-4 rounded-xl text-lg font-medium">
                <span className="flex items-center gap-4">
                  <Grid3X3 className="h-5 w-5 text-primary" />
                  주요제품
                </span>
                <ChevronDown className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  expandedCategory === 'products' && "rotate-180"
                )} />
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pl-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {mainCategories.map((mainCat) => (
                  <Collapsible
                    key={mainCat.id}
                    open={expandedCategory === mainCat.id}
                    onOpenChange={(open) => setExpandedCategory(open ? mainCat.id : 'products')}
                  >
                    <CollapsibleTrigger className="w-full flex items-center justify-between text-primary font-semibold py-3 px-4 rounded-lg hover:bg-muted transition-colors">
                      {mainCat.name}
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        expandedCategory === mainCat.id && "rotate-180"
                      )} />
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="pl-4 space-y-1">
                      {getSubcategories(mainCat.id).map((subCat) => (
                        <Link
                          key={subCat.id}
                          to={`/product/${mainCat.slug}/${subCat.slug}`}
                          onClick={handleLinkClick}
                          className="block text-muted-foreground hover:text-primary py-3 px-4 rounded-lg hover:bg-muted transition-colors"
                        >
                          {subCat.name}
                        </Link>
                      ))}
                      <Link
                        to={`/product/${mainCat.slug}`}
                        onClick={handleLinkClick}
                        className="block text-accent font-medium hover:text-primary py-3 px-4 rounded-lg hover:bg-muted transition-colors"
                      >
                        {mainCat.name} 전체 보기
                      </Link>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
                
                <Link
                  to="/product/all"
                  onClick={handleLinkClick}
                  className="flex items-center gap-2 font-semibold text-accent hover:text-primary py-3 px-4 rounded-lg hover:bg-muted transition-colors"
                >
                  전체 제품 보기
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </CollapsibleContent>
            </Collapsible>

            {/* 납품사례 */}
            <Link
              to="/delivery-cases"
              onClick={handleLinkClick}
              className="w-full flex items-center gap-4 text-foreground hover:text-primary hover:bg-muted transition-colors py-4 px-4 rounded-xl text-lg font-medium"
            >
              <FileText className="h-5 w-5 text-primary" />
              납품사례
            </Link>

            {/* 카탈로그 */}
            <Link
              to="/catalogs"
              onClick={handleLinkClick}
              className="w-full flex items-center gap-4 text-foreground hover:text-primary hover:bg-muted transition-colors py-4 px-4 rounded-xl text-lg font-medium"
            >
              <FileText className="h-5 w-5 text-primary" />
              카탈로그
            </Link>
          </nav>
        </div>

        {/* CTA Button - Fixed at bottom */}
        <div className="p-4 border-t border-border bg-background safe-area-inset">
          <Link
            to="/inquiry"
            onClick={handleLinkClick}
            className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground px-6 py-4 rounded-xl hover:bg-primary/90 transition-all font-bold shadow-lg text-lg"
          >
            <Phone className="h-5 w-5" />
            견적/문의하기
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};
