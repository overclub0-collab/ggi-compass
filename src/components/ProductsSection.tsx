import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import officeChairImage from '@/assets/category-office-chair.png';
import blackboardCabinetImage from '@/assets/category-blackboard-cabinet.png';
import workstationImage from '@/assets/category-workstation.jpg';
import cafeteriaImage from '@/assets/category-cafeteria.jpg';
import categoryOfficeImage from '@/assets/category-office.jpg';
import categoryDiningImage from '@/assets/category-dining.jpg';
import categoryLabImage from '@/assets/category-lab.png';
import categoryMilitaryImage from '@/assets/category-military.jpg';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  display_order: number;
  description?: string;
  image_url?: string;
}

// Default images for main categories
const categoryImages: Record<string, string> = {
  'educational': blackboardCabinetImage,
  'office': categoryOfficeImage,
  'chairs': officeChairImage,
  'dining': categoryDiningImage,
  'lab': categoryLabImage,
  'military': categoryMilitaryImage,
};

// Badge labels for main categories
const categoryBadges: Record<string, string[]> = {
  'educational': ['MAS 등록', '조달청 등록'],
  'office': ['KS 인증', '모듈형 설계'],
  'chairs': ['인체공학', '높이 조절형'],
};

export const ProductsSection = () => {
  const [mainCategories, setMainCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setMainCategories(data);
    }
  };

  return (
    <section id="products" className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full mb-6 uppercase tracking-widest">
            Our Products
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-primary">
            위대한 생각이 시작되는 공간
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {mainCategories.map((category, index) => (
            <div
              key={category.id}
              className="group bg-background rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={category.image_url || categoryImages[category.slug] || '/placeholder.svg'}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-primary mb-2">{category.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-2">
                  {category.description || `${category.name} 제품을 만나보세요.`}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(categoryBadges[category.slug] || ['프리미엄', '품질 보증']).map((badge) => (
                    <Badge
                      key={badge}
                      variant="secondary"
                      className="bg-accent/10 text-accent border-0 font-medium text-xs"
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
                <Link to={`/product/${category.slug}`}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    자세히 보기
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All Products Button */}
        <div className="text-center mt-12">
          <Link to="/product/all">
            <Button variant="outline" size="lg">
              전체 제품 보기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
