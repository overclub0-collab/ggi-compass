import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Mail } from 'lucide-react';

const products = {
  'blackboard-cabinet': {
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=1200&auto=format&fit=crop',
    title: '칠판보조장',
    description: '효율적인 수납과 슬라이딩 시스템으로 교실 정면의 완성도를 높이는 프리미엄 칠판보조장.',
    badges: ['MAS 등록', '조달청 식별번호 보유'],
    features: [
      '슬라이딩 도어 시스템으로 편리한 수납',
      '내구성 높은 멜라민 마감재',
      '다양한 사이즈 맞춤 제작 가능',
      '교실 환경에 최적화된 설계',
    ],
    specs: {
      재질: '고급 멜라민 합판',
      색상: '화이트, 우드톤 등 선택 가능',
      인증: 'KS 인증, 친환경 인증',
    },
  },
  'workstation': {
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
    title: '워크스테이션',
    description: '업무 효율성을 극대화하는 모듈형 워크스테이션. 다양한 공간에 맞춤 설치 가능.',
    badges: ['KS 인증', '모듈형 설계'],
    features: [
      '모듈형 설계로 공간 맞춤 구성',
      '케이블 정리 시스템 내장',
      '인체공학적 작업 환경 제공',
      '확장 및 재배치 용이',
    ],
    specs: {
      재질: '스틸 프레임 + 멜라민 상판',
      색상: '그레이, 화이트, 우드톤',
      인증: 'KS 인증',
    },
  },
  'office-chair': {
    image: 'https://images.unsplash.com/photo-1589384267710-7a25bc5b4862?q=80&w=1200&auto=format&fit=crop',
    title: '오피스체어',
    description: '인체공학적 설계로 장시간 착석에도 편안한 프리미엄 오피스체어.',
    badges: ['인체공학', '높이 조절형'],
    features: [
      '인체공학적 등받이 설계',
      '높이 및 팔걸이 조절 기능',
      '통기성 좋은 메쉬 소재',
      '360도 회전 및 이동 용이',
    ],
    specs: {
      재질: '메쉬 + 고밀도 폼',
      색상: '블랙, 그레이',
      인증: '인체공학 인증',
    },
  },
  'cafeteria-furniture': {
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop',
    title: '식당가구',
    description: '공공기관 식당에 최적화된 내구성 높은 식당 테이블 및 의자 세트.',
    badges: ['친환경 소재', '고강도 내구성'],
    features: [
      '고강도 내구성 설계',
      '청소 및 관리 용이',
      '다양한 배치 구성 가능',
      '친환경 소재 사용',
    ],
    specs: {
      재질: '스틸 프레임 + HPL 상판',
      색상: '화이트, 그레이, 우드톤',
      인증: '친환경 인증',
    },
  },
};

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const product = productId ? products[productId as keyof typeof products] : null;

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">제품을 찾을 수 없습니다</h1>
          <Link to="/#products">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              제품 목록으로 돌아가기
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link to="/#products" className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            제품 목록으로 돌아가기
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover aspect-[4/3]"
              />
            </div>

            {/* Product Info */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
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
              
              <h1 className="text-4xl font-black text-primary mb-4">{product.title}</h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Features */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-primary mb-4">주요 특징</h2>
                <ul className="space-y-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Specs */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-primary mb-4">제품 사양</h2>
                <div className="bg-muted/50 rounded-xl p-6 space-y-3">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-medium text-primary w-24">{key}</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact CTA */}
              <div className="bg-primary/5 rounded-xl p-6">
                <h3 className="text-lg font-bold text-primary mb-3">견적 및 문의</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  제품에 대한 자세한 견적이나 문의사항이 있으시면 연락주세요.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Phone className="mr-2 h-4 w-4" />
                    전화 문의
                  </Button>
                  <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    이메일 문의
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
