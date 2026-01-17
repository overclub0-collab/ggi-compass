import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import officeChairImage from '@/assets/category-office-chair.png';
import blackboardCabinetImage from '@/assets/category-blackboard-cabinet.png';
import workstationImage from '@/assets/category-workstation.jpg';
import cafeteriaImage from '@/assets/category-cafeteria.jpg';

// Static category data for the main page display
const categories = [
  {
    slug: 'blackboard-cabinet',
    image: blackboardCabinetImage,
    title: '칠판보조장',
    description: '효율적인 수납과 슬라이딩 시스템으로 교실 정면의 완성도를 높이는 프리미엄 칠판보조장.',
    badges: ['MAS 등록', '조달청 식별번호 보유'],
  },
  {
    slug: 'workstation',
    image: workstationImage,
    title: '워크스테이션',
    description: '업무 효율성을 극대화하는 모듈형 워크스테이션. 다양한 공간에 맞춤 설치 가능.',
    badges: ['KS 인증', '모듈형 설계'],
  },
  {
    slug: 'office-chair',
    image: officeChairImage,
    title: '오피스체어',
    description: '인체공학적 설계로 장시간 착석에도 편안한 프리미엄 오피스체어.',
    badges: ['인체공학', '높이 조절형'],
  },
  {
    slug: 'cafeteria-furniture',
    image: cafeteriaImage,
    title: '식당가구',
    description: '공공기관 식당에 최적화된 내구성 높은 식당 테이블 및 의자 세트.',
    badges: ['친환경 소재', '고강도 내구성'],
  },
];

export const ProductsSection = () => {
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <div
              key={category.slug}
              className="group bg-background rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-primary mb-2">{category.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-2">
                  {category.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {category.badges.map((badge) => (
                    <Badge
                      key={badge}
                      variant="secondary"
                      className="bg-accent/10 text-accent border-0 font-medium text-xs"
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
                <Link to={`/products/category/${category.slug}`}>
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
          <Link to="/products/category/all">
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
