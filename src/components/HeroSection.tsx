import { ExternalLink, Play, BadgeCheck, Building2, Leaf, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  description: 'KS 규격 및 조달청 품질검사를 통과한 신뢰의 제품'
}];
export const HeroSection = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };
  return <section id="hero" className="relative min-h-screen">
      {/* Hero Background - Real classroom image with overlay */}
      <div className="absolute inset-0 bg-cover bg-center" style={{
      backgroundImage: `url(${heroClassroom})`
    }} />
      {/* Light overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/40" />
      
      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-20">
        <div className="max-w-3xl">
          <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full mb-8 uppercase tracking-widest border border-primary/20">
            Professional Education Furniture
          </div>
          
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-black text-foreground leading-tight tracking-tight">Global
Great
Intelligent<span className="text-primary">G</span>lobal<br />
              <span className="text-primary">G</span>reat<br />
              <span className="text-primary">I</span>ntelligent
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed">
            아이들의 무한한 상상력이 펼쳐지는 공간,<br />
            <span className="text-foreground font-semibold">주식회사 지지아이</span>가 만드는 미래 교육의 기반입니다.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 text-base shadow-lg" onClick={() => window.open('https://www.g2b.go.kr', '_blank')}>
              <ExternalLink className="w-5 h-5 mr-2" />
              조달청 나라장터 바로가기
            </Button>
            <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 font-bold px-8 py-6 text-base" onClick={() => scrollToSection('about')}>
              <Play className="w-5 h-5 mr-2" />
              브랜드 스토리
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => <div key={feature.title} className="bg-white/80 backdrop-blur-sm border border-border rounded-xl p-6 hover:shadow-lg transition-all group animate-fade-in" style={{
          animationDelay: `${index * 0.1}s`
        }}>
              <feature.icon className="w-8 h-8 text-accent mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>)}
        </div>
      </div>
    </section>;
};