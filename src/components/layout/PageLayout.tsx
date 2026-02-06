import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  className?: string;
}

export const PageLayout = ({ 
  children, 
  showBottomNav = true,
  className = ""
}: PageLayoutProps) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen bg-background overflow-x-hidden ${className}`}>
      <Navbar />
      
      {children}
      
      <Footer />

      {/* Add bottom padding for mobile to account for bottom nav */}
      {showBottomNav && <div className="md:hidden h-16" />}
      
      {showBottomNav && (
        <MobileBottomNav onHomeClick={scrollToTop} />
      )}
    </div>
  );
};
