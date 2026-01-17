import { Badge } from '@/components/ui/badge';

const products = [
  {
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop',
    title: '프리미엄 칠판보조장',
    description: '효율적인 수납과 슬라이딩 시스템으로 교실 정면의 완성도를 높입니다.',
    badges: ['MAS 등록', '조달청 식별번호 보유'],
  },
  {
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop',
    title: '인체공학형 책걸상',
    description: '성장기 학생들의 체형을 고려한 조절 시스템과 내구성을 갖춘 표준 책걸상.',
    badges: ['KS 인증', '높이 조절형'],
  },
  {
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800&auto=format&fit=crop',
    title: '시스템 수납 가구',
    description: '공간의 규모와 목적에 맞춰 자유롭게 배치 가능한 모듈형 수납 시스템.',
    badges: ['친환경 소재', '잠금 장치 옵션'],
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <div className="p-6">
                <h3 className="text-xl font-bold text-primary mb-3">{product.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {product.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.badges.map((badge) => (
                    <Badge
                      key={badge}
                      variant="secondary"
                      className="bg-accent/10 text-accent border-0 font-medium"
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
