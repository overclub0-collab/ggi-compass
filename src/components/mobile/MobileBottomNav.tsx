import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3X3, FileText, Phone, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  onHomeClick?: () => void;
}

export const MobileBottomNav = ({ onHomeClick }: MobileBottomNavProps) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const navItems = [
    { 
      icon: Home, 
      label: '홈', 
      href: '/', 
      isHome: true 
    },
    { 
      icon: Grid3X3, 
      label: '제품', 
      href: '/product/all' 
    },
    { 
      icon: FileText, 
      label: '납품사례', 
      href: '/delivery-cases' 
    },
    { 
      icon: BookOpen, 
      label: '카탈로그', 
      href: '/catalogs' 
    },
    { 
      icon: Phone, 
      label: '문의', 
      href: '/inquiry' 
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const handleNavClick = (item: typeof navItems[0], e: React.MouseEvent) => {
    if (item.isHome && isHomePage && onHomeClick) {
      e.preventDefault();
      onHomeClick();
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50 safe-area-inset">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={(e) => handleNavClick(item, e)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors",
              "touch-target",
              isActive(item.href) 
                ? "text-primary" 
                : "text-muted-foreground hover:text-primary"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 mb-1",
              isActive(item.href) && "text-primary"
            )} />
            <span className={cn(
              "text-xs font-medium",
              isActive(item.href) && "text-primary font-semibold"
            )}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
