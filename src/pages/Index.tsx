import { PageLayout } from '@/components/layout/PageLayout';
import { HeroSection } from '@/components/HeroSection';
import { ProcurementSection } from '@/components/ProcurementSection';
import { ProductsSection } from '@/components/ProductsSection';
import PopupDisplay from '@/components/PopupDisplay';

const Index = () => {
  return (
    <PageLayout>
      <PopupDisplay />
      <HeroSection />
      <section id="about">
        <ProcurementSection />
      </section>
      <ProductsSection />
    </PageLayout>
  );
};

export default Index;
