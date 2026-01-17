import { CheckCircle, ArrowRight } from 'lucide-react';

const benefits = [
  '공공기관 여성기업 제품 의무구매 목표제(물품 5%) 적용',
  '최대 5천만 원(부가세 포함) 이하 1인 수의계약 가능',
  '조달청 물품 구매 적격심사 가점 부여 대상',
];

const processSteps = [
  { step: '01', title: '제품 선정 및 식별번호 확인' },
  { step: '02', title: '나라장터/S2B 주문 및 계약' },
  { step: '03', title: '전문 설치팀 현장 배송 및 조립' },
  { step: '04', title: '검수 완료 및 신속한 사후 관리' },
];

export const ProcurementSection = () => {
  return (
    <section id="procurement" className="py-24 bg-secondary">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left Column */}
          <div>
            <div className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full mb-6 uppercase tracking-widest">
              Procurement Guide
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-primary mb-6 leading-tight">
              빠르고 투명한<br />공공 조달 솔루션
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              주식회사 지지아이는 국가종합전자조달시스템(나라장터)에 정식 등록된 기업입니다. 학교 및 공공기관에서 필요한 가구를 효율적으로 구매하실 수 있도록 적극 지원합니다.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-card p-4 rounded-lg shadow-sm">
                <CheckCircle className="w-6 h-6 text-accent flex-shrink-0" />
                <span className="font-medium">나라장터 종합쇼핑몰 등록 완료</span>
              </div>
              <div className="flex items-center gap-3 bg-card p-4 rounded-lg shadow-sm">
                <CheckCircle className="w-6 h-6 text-accent flex-shrink-0" />
                <span className="font-medium">학교장터(S2B) 1인 견적 수의계약</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Benefits Card */}
            <div className="bg-primary rounded-2xl p-8 text-primary-foreground">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full"></span>
                여성기업 우대 제도
              </h3>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-primary-foreground/90">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Process Card */}
            <div className="bg-card rounded-2xl p-8 border border-border">
              <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full"></span>
                계약 프로세스 안내
              </h3>
              <div className="space-y-4">
                {processSteps.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 group">
                    <span className="text-2xl font-black text-accent">{item.step}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
