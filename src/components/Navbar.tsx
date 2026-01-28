import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ggiLogo from '@/assets/ggi-logo-new.png';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  description?: string;
}

const navItems = [
  { id: 'about', label: '기업소개', isExternal: false },
  { id: 'procurement', label: '나라장터/조달', isExternal: true, href: 'https://shop.g2b.go.kr/' },
  { id: 'products', label: '주요제품', isExternal: false, hasMegaMenu: true },
  { id: 'delivery-cases', label: '납품사례', isExternal: false, isDeliveryCasesLink: true },
];

export const Navbar = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const location = useLocation();

  // Minimum swipe distance (in px) to trigger close
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchEnd - touchStart;
    const isRightSwipe = distance > minSwipeDistance;
    if (isRightSwipe) {
      setMobileMenuOpen(false);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
  };

  const mainCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => 
    categories.filter(c => c.parent_id === parentId);

  useEffect(() => {
    if (!isHomePage) return;
    
    const handleScroll = () => {
      const sections = ['hero', 'about', 'procurement', 'products', 'contact'];
      let current = 'hero';
      sections.forEach(section => {
        const element = document.getElementById(section);
        if (element && window.scrollY >= element.offsetTop - 120) {
          current = section;
        }
      });
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const scrollToSection = (id: string) => {
    if (!isHomePage) {
      window.location.href = `/#${id}`;
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
    setMegaMenuOpen(false);
  };

  const toggleMobileCategory = (categoryId: string) => {
    setExpandedMobileCategory(prev => prev === categoryId ? null : categoryId);
  };

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 shadow-sm border-b border-border safe-area-inset">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 justify-between items-center flex flex-row">
        <Link to="/" className="flex items-center touch-target">
          <img src={ggiLogo} alt="GGI 로고" className="h-10 sm:h-12 w-auto" />
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8 text-sm font-medium h-full leading-none">
          {navItems.map(item => {
            if (item.isExternal) {
              return (
                <a 
                  key={item.id} 
                  href={item.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-foreground/70 hover:text-primary transition-colors py-2 flex items-center leading-none"
                >
                  {item.label}
                </a>
              );
            }
            
            if (item.hasMegaMenu) {
              return (
                <div 
                  key={item.id}
                  className="relative flex items-center h-full"
                  onMouseEnter={() => setMegaMenuOpen(true)}
                  onMouseLeave={() => setMegaMenuOpen(false)}
                >
                  <button 
                    className={cn(
                      "text-foreground/70 hover:text-primary transition-colors flex items-center gap-1 py-2 leading-none", 
                      activeSection === item.id && "text-primary"
                    )}
                  >
                    <span className="flex items-center">{item.label}</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform flex-shrink-0",
                      megaMenuOpen && "rotate-180"
                    )} />
                  </button>

                  {/* Mega Menu */}
                  {megaMenuOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2">
                      <div className="bg-white rounded-xl shadow-2xl border border-border p-6 min-w-[500px] lg:min-w-[600px]">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                          {mainCategories.map((mainCat) => (
                            <div key={mainCat.id} className="space-y-3">
                              <Link
                                to={`/product/${mainCat.slug}`}
                                className="text-primary font-bold text-sm hover:text-accent transition-colors block"
                                onClick={() => setMegaMenuOpen(false)}
                              >
                                {mainCat.name}
                              </Link>
                              <div className="space-y-1">
                                {getSubcategories(mainCat.id).map((subCat) => (
                                  <Link
                                    key={subCat.id}
                                    to={`/product/${mainCat.slug}/${subCat.slug}`}
                                    className="text-muted-foreground text-sm hover:text-primary transition-colors block py-1"
                                    onClick={() => setMegaMenuOpen(false)}
                                  >
                                    {subCat.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <Link
                            to="/product/all"
                            className="text-accent font-medium text-sm hover:text-primary transition-colors flex items-center gap-1"
                            onClick={() => setMegaMenuOpen(false)}
                          >
                            전체 제품 보기
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (item.isDeliveryCasesLink) {
              return (
                <Link 
                  key={item.id}
                  to="/delivery-cases"
                  className={cn(
                    "text-foreground/70 hover:text-primary transition-colors py-2 flex items-center leading-none"
                  )}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <button 
                key={item.id} 
                onClick={() => scrollToSection(item.id)} 
                className={cn(
                  "text-foreground/70 hover:text-primary transition-colors py-2 flex items-center leading-none", 
                  activeSection === item.id && "text-primary"
                )}
              >
                {item.label}
              </button>
            );
          })}
          <Link 
            to="/inquiry"
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-all font-bold shadow-md"
          >
            견적/문의
          </Link>
        </div>

        {/* Mobile Menu Button - Touch-friendly 44px target */}
        <button 
          className="md:hidden text-foreground p-2 -mr-2 touch-target" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay Container */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop - must render BEFORE panel for proper stacking */}
          <div 
            className="md:hidden fixed inset-0 top-16 sm:top-20 bg-black/30 z-40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Mobile Menu Panel */}
          <div 
            className="md:hidden fixed inset-y-0 right-0 top-16 sm:top-20 w-full max-w-sm bg-white z-50 shadow-xl overflow-hidden animate-in slide-in-from-right duration-300"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="h-full overflow-y-auto overscroll-contain pb-safe">
              <div className="px-4 sm:px-6 py-4 space-y-1">
                {navItems.map(item => {
                  if (item.isExternal) {
                    return (
                      <a 
                        key={item.id} 
                        href={item.href} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block w-full text-left text-foreground/70 hover:text-primary hover:bg-muted transition-colors py-4 px-3 rounded-lg text-base font-medium"
                      >
                        {item.label}
                      </a>
                    );
                  }

                  if (item.hasMegaMenu) {
                    return (
                      <div key={item.id} className="border-b border-border/30 last:border-b-0">
                        <button
                          onClick={() => toggleMobileCategory('products-main')}
                          className="w-full text-left text-foreground/70 hover:text-primary hover:bg-muted transition-colors py-4 px-3 rounded-lg flex items-center justify-between text-base font-medium"
                        >
                          {item.label}
                          <ChevronDown className={cn(
                            "h-5 w-5 transition-transform",
                            expandedMobileCategory === 'products-main' && "rotate-180"
                          )} />
                        </button>
                        
                        {/* Mobile Accordion Categories */}
                        {expandedMobileCategory === 'products-main' && (
                          <div className="pl-4 pb-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
                            {mainCategories.map((mainCat) => (
                              <div key={mainCat.id}>
                                <button
                                  onClick={() => toggleMobileCategory(mainCat.id)}
                                  className="w-full text-left font-semibold text-primary py-3 px-3 flex items-center justify-between rounded-lg hover:bg-muted transition-colors"
                                >
                                  {mainCat.name}
                                  <ChevronDown className={cn(
                                    "h-4 w-4 transition-transform",
                                    expandedMobileCategory === mainCat.id && "rotate-180"
                                  )} />
                                </button>
                                
                                {expandedMobileCategory === mainCat.id && (
                                  <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                    {getSubcategories(mainCat.id).map((subCat) => (
                                      <Link
                                        key={subCat.id}
                                        to={`/product/${mainCat.slug}/${subCat.slug}`}
                                        className="block text-muted-foreground hover:text-primary py-3 px-3 rounded-lg hover:bg-muted transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                      >
                                        {subCat.name}
                                      </Link>
                                    ))}
                                    <Link
                                      to={`/product/${mainCat.slug}`}
                                      className="block text-accent font-medium hover:text-primary py-3 px-3 rounded-lg hover:bg-muted transition-colors"
                                      onClick={() => setMobileMenuOpen(false)}
                                    >
                                      {mainCat.name} 전체 보기
                                    </Link>
                                  </div>
                                )}
                              </div>
                            ))}
                            <Link
                              to="/product/all"
                              className="block font-semibold text-accent hover:text-primary py-3 px-3 rounded-lg hover:bg-muted transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              전체 제품 보기
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (item.isDeliveryCasesLink) {
                    return (
                      <Link 
                        key={item.id}
                        to="/delivery-cases"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full text-left text-foreground/70 hover:text-primary hover:bg-muted transition-colors py-4 px-3 rounded-lg text-base font-medium"
                      >
                        {item.label}
                      </Link>
                    );
                  }

                  return (
                    <button 
                      key={item.id} 
                      onClick={() => scrollToSection(item.id)} 
                      className="block w-full text-left text-foreground/70 hover:text-primary hover:bg-muted transition-colors py-4 px-3 rounded-lg text-base font-medium"
                    >
                      {item.label}
                    </button>
                  );
                })}
                
                {/* Mobile CTA Button */}
                <div className="pt-4 mt-4 border-t border-border">
                  <Link 
                    to="/inquiry"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full bg-primary text-primary-foreground px-6 py-4 rounded-lg hover:bg-primary/90 transition-all font-bold shadow-md text-center"
                  >
                    견적/문의하기
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};
