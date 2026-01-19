import { CheckCircle, ArrowRight, Quote, Award, Building2 } from 'lucide-react';

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
        {/* CEO 인사말 섹션 */}
        <div className="mb-20">
          <div className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full mb-6 uppercase tracking-widest">
            CEO Message
          </div>
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            {/* CEO 인사말 텍스트 */}
            <div className="lg:col-span-3">
              <div className="relative">
                <Quote className="absolute -top-4 -left-4 w-12 h-12 text-accent/20" />
                <h2 className="text-3xl md:text-4xl font-black text-primary mb-6 leading-tight">
                  안녕하세요,<br />
                  <span className="text-accent">주식회사 지지아이</span>입니다
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    교육의 미래를 함께 만들어가는 <strong className="text-foreground">여성기업 주식회사 지지아이</strong>입니다.
                  </p>
                  <p>
                    저희는 신생기업이지만, 사무용 가구와 교육용 가구 분야에서 오랜 경험과 전문성을 갖춘 팀이 모여 
                    새로운 도전을 시작했습니다. 단순히 가구를 공급하는 것이 아닌, 
                    <strong className="text-foreground"> 학생들의 학습 환경과 교직원분들의 업무 효율을 높이는 최적의 공간</strong>을 
                    만들어 드리고자 합니다.
                  </p>
                  <p>
                    공공기관과 학교의 니즈를 정확히 이해하고, 조달 절차부터 설치, 사후관리까지 
                    <strong className="text-foreground"> 원스톱 서비스</strong>를 제공합니다. 
                    작지만 민첩하게, 고객 한 분 한 분께 정성을 다하는 기업이 되겠습니다.
                  </p>
                  <p className="text-primary font-semibold pt-2">
                    감사합니다.
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-2xl font-black text-primary-foreground">GGI</span>
                  </div>
                  <div>
                    <p className="font-bold text-primary text-lg">주식회사 지지아이 대표이사 차 경 희</p>
                    <p className="text-sm text-muted-foreground">Women-Owned Business</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* CEO 인사말 배지 */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-primary rounded-2xl p-6 text-primary-foreground">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8 text-accent" />
                  <h3 className="font-bold text-lg">여성기업 인증</h3>
                </div>
                <p className="text-sm text-primary-foreground/80">
                  중소벤처기업부 인증 여성기업으로서 공공기관 우선구매 대상 기업입니다.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-8 h-8 text-primary" />
                  <h3 className="font-bold text-lg text-primary">전문 분야</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                    교육용 가구 (책상, 의자, 칠판, 사물함)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                    사무용 가구 (워크스테이션, 회의용)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                    공공기관 맞춤 가구 솔루션
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 기존 조달 가이드 섹션 */}
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