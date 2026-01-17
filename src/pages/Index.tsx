import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { ProcurementSection } from '@/components/ProcurementSection';
import { ProductsSection } from '@/components/ProductsSection';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <section id="about">
        <ProcurementSection />
      </section>
      <ProductsSection />
      <Footer />
    </div>
  );
};

export default Index;
