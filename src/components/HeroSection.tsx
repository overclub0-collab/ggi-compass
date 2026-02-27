import { ExternalLink, BadgeCheck, Building2, Leaf, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CatalogDownloadButton } from '@/components/CatalogDownloadButton';
import heroClassroom from '@/assets/hero-classroom.jpg';
const features = [{
  icon: BadgeCheck,
  title: '여성기업',
  description: '공공기관 우선구매 및 수의계약 혜택 적용 기업'
}, {
  icon: Building2,
  title: '나라장터 등록',
  description: '조달청 MAS 정식 등록을 통한 투명한 계약 프로세스'
}, {
  icon: Leaf,
  title: '친환경 E0',
  description: '최고 등급 친환경 소재만을 사용하는 학생 중심 철학'
}, {
  icon: ShieldCheck,
  title: '품질 보증',
  description: '조달청 품질검사를 통과한 신뢰의 제품'
}];
export const HeroSection = () => {
  return <section id="hero" className="relative min-h-screen overflow-hidden">
      {/* Hero Background - Real classroom image with blue overlay (IKEA style) */}
      <div className="absolute inset-0 bg-cover bg-center" style={{
      backgroundImage: `url(${heroClassroom})`
    }} />
      {/* Blue overlay for IKEA style */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/50" />
      
      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-3xl">
          <div className="inline-block px-3 sm:px-4 py-1.5 bg-accent text-accent-foreground text-xs font-bold rounded-full mb-6 sm:mb-8 uppercase tracking-widest">
            Professional Education Furniture
          </div>
          
          <div className="mb-6 sm:mb-8">
            <h1 className="heading-fluid-xl font-black text-white leading-tight tracking-tight">
              <span className="text-accent">G</span>lobal<br />
              <span className="text-accent">G</span>reat<br />
              <span className="text-accent">I</span>ntelligent Furniture  
            </h1>
          </div>
          
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 sm:mb-10 leading-relaxed">
            아이들의 무한한 상상력이 펼쳐지는 공간,<br className="hidden sm:block" />
            <span className="text-accent font-semibold">GGI</span>가 만드는 미래 교육의 기반입니다.
          </p>
          
          {/* Mobile: Stack buttons vertically, Desktop: Side by side */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base shadow-lg w-full sm:w-auto justify-center" onClick={() => window.open('https://shop.g2b.go.kr/', '_blank')}>
              <ExternalLink className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>조달청 나라장터 바로가기</span>
            </Button>
            <CatalogDownloadButton variant="hero" />
          </div>
          
          {/* Fixed mobile catalog button */}
          <CatalogDownloadButton variant="fixed" />
        </div>
      </div>

      {/* Feature Cards - 1 column on mobile, 2 on sm, 4 on lg */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 md:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map((feature, index) => <div key={feature.title} className="bg-white/90 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all group animate-fade-in" style={{
          animationDelay: `${index * 0.1}s`
        }}>
              <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-accent mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-1 sm:mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>)}
        </div>
      </div>
    </section>;
};