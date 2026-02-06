import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Menu, ChevronDown, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ggiLogo from '@/assets/ggi-logo-new.png';
import { supabase } from '@/integrations/supabase/client';
import { MobileMenu } from './mobile/MobileMenu';

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
  const location = useLocation();

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

  const scrollToSection = useCallback((id: string) => {
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
  }, [isHomePage]);

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <>
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

          {/* Mobile Menu Button */}
          <button 
            type="button"
            className="md:hidden text-foreground p-2 -mr-2 touch-target" 
            onClick={handleMobileMenuToggle}
            aria-label="메뉴 열기"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Sheet */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        categories={categories}
        onScrollToSection={scrollToSection}
      />
    </>
  );
};
