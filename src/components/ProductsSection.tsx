import { Badge } from '@/components/ui/badge';

const products = [
  {
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop',
    title: '칠판보조장',
    description: '효율적인 수납과 슬라이딩 시스템으로 교실 정면의 완성도를 높이는 프리미엄 칠판보조장.',
    badges: ['MAS 등록', '조달청 식별번호 보유'],
  },
  {
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop',
    title: '워크스테이션',
    description: '업무 효율성을 극대화하는 모듈형 워크스테이션. 다양한 공간에 맞춤 설치 가능.',
    badges: ['KS 인증', '모듈형 설계'],
  },
  {
    image: 'https://images.unsplash.com/photo-1589384267710-7a25bc5b4862?q=80&w=800&auto=format&fit=crop',
    title: '오피스체어',
    description: '인체공학적 설계로 장시간 착석에도 편안한 프리미엄 오피스체어.',
    badges: ['인체공학', '높이 조절형'],
  },
  {
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop',
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
          {products.map((product, index) => (
            <div
              key={product.title}
              className="group bg-background rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-primary mb-2">{product.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-2">
                  {product.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.badges.map((badge) => (
                    <Badge
                      key={badge}
                      variant="secondary"
                      className="bg-accent/10 text-accent border-0 font-medium text-xs"
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
