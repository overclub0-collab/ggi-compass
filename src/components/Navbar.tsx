import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Menu, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ggiLogo from '@/assets/ggi-logo-new.png';
import { supabase } from '@/integrations/supabase/client';
import { MobileMenu } from './mobile/MobileMenu';
import { MegaMenu } from './MegaMenu';

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
{ id: 'planner', label: '3D 인테리어', isExternal: false, isPlannerLink: true }];


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
    const { data, error } = await supabase.
    from('categories').
    select('*').
    eq('is_active', true).
    order('display_order', { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
  };

  const mainCategories = categories.filter((c) => !c.parent_id);
  const getSubcategories = (parentId: string) =>
  categories.filter((c) => c.parent_id === parentId);

  useEffect(() => {
    if (!isHomePage) return;

    const handleScroll = () => {
      const sections = ['hero', 'about', 'procurement', 'products', 'contact'];
      let current = 'hero';
      sections.forEach((section) => {
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
    setMobileMenuOpen((prev) => !prev);
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
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2.5 h-full">
            {navItems.map((item) => {
              const baseNavClass = "relative h-10 px-4 flex items-center justify-center leading-none tracking-tight text-foreground/80 font-bold text-[16px] transition-all duration-300 hover:text-primary hover:scale-105 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-primary after:rounded-full after:transition-all after:duration-300 after:ease-out hover:after:w-full";
              const activeNavClass = "text-primary after:w-full";

              if (item.isExternal) {
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={baseNavClass}>
                    {item.label}
                  </a>);
              }

              if (item.hasMegaMenu) {
                return (
                  <div
                    key={item.id}
                    className="relative flex items-center h-full"
                    onMouseEnter={() => setMegaMenuOpen(true)}
                    onMouseLeave={() => setMegaMenuOpen(false)}>
                    <button
                      className={cn(baseNavClass, "gap-1",
                        activeSection === item.id && activeNavClass
                      )}>
                      <span>{item.label}</span>
                      <ChevronDown className={cn(
                        "h-3.5 w-3.5 transition-transform duration-300 flex-shrink-0 opacity-50",
                        megaMenuOpen && "rotate-180"
                      )} />
                    </button>
                    {megaMenuOpen &&
                      <MegaMenu
                        categories={categories}
                        onClose={() => setMegaMenuOpen(false)} />
                    }
                  </div>);
              }

              if (item.isDeliveryCasesLink) {
                return (
                  <Link
                    key={item.id}
                    to="/delivery-cases"
                    className={baseNavClass}>
                    {item.label}
                  </Link>);
              }

              if ((item as any).isPlannerLink) {
                return (
                  <Link
                    key={item.id}
                    to="/planner"
                    className="h-10 px-6 bg-accent text-accent-foreground rounded-lg transition-all duration-300 hover:bg-accent/85 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center leading-none text-[16px] font-bold tracking-tight">
                    {item.label}
                  </Link>);
              }

              if (item.id === 'about') {
                return (
                  <Link
                    key={item.id}
                    to="/about"
                    className={baseNavClass}>
                    {item.label}
                  </Link>);
              }

              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={cn(baseNavClass,
                    activeSection === item.id && activeNavClass
                  )}>
                  {item.label}
                </button>);
            })}
            <Link
              to="/inquiry"
              className="h-10 px-6 ml-1 rounded-lg transition-all duration-300 border-0 text-primary-foreground bg-primary font-bold hover:bg-primary/90 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center text-[16px] tracking-tight">
              견적/문의
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button type="button"
          className="md:hidden text-foreground p-2 -mr-2 touch-target"
          onClick={handleMobileMenuToggle}
          aria-label="메뉴 열기"
          aria-expanded={mobileMenuOpen}>
            
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Sheet */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        categories={categories}
        onScrollToSection={scrollToSection} />
      
    </>);

};