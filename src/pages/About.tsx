import { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Award, History, Eye, MessageSquare, Quote, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface CompanySection {
  id: string;
  section_key: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  display_order: number;
}

const sectionIcons: Record<string, React.ReactNode> = {
  hero: <Building2 className="h-6 w-6" />,
  greeting: <MessageSquare className="h-6 w-6" />,
  vision: <Eye className="h-6 w-6" />,
  history: <History className="h-6 w-6" />,
  certifications: <Award className="h-6 w-6" />,
};

const About = () => {
  const [sections, setSections] = useState<CompanySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      const { data } = await supabase
        .from('company_info')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (data) setSections(data as CompanySection[]);
      setIsLoading(false);
    };
    fetchSections();
  }, []);

  const heroSection = sections.find(s => s.section_key === 'hero');
  const otherSections = sections.filter(s => s.section_key !== 'hero');

  if (isLoading) {
    return (
      <PageLayout>
        <div className="pt-20 min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="pt-20">
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {heroSection?.image_url && (
              <img
                src={heroSection.image_url}
                alt="회사 대표 이미지"
                className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-2xl mx-auto mb-8 shadow-lg border-4 border-background"
              />
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary mb-4">
              {heroSection?.title || '주식회사 지지아이'}
            </h1>
            {heroSection?.content && (
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
                {heroSection.content}
              </p>
            )}
          </div>
        </section>

        {/* Brand Story Section */}
        <section className="py-12 sm:py-16 bg-secondary">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full mb-6 uppercase tracking-widest">
              Brand Story
            </div>
            <div className="grid md:grid-cols-5 gap-8 items-start">
              <div className="md:col-span-3 relative">
                <Quote className="absolute -top-2 -left-2 sm:-top-4 sm:-left-4 w-8 h-8 sm:w-12 sm:h-12 text-accent/20" />
                <h2 className="text-2xl sm:text-3xl font-black text-primary mb-4 sm:mb-6 leading-tight">
                  안녕하세요,<br />
                  <span className="text-accent">주식회사 지지아이</span>입니다
                </h2>
                <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
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
                  <p className="text-primary font-semibold pt-2">감사합니다.</p>
                </div>
                <div className="mt-6 sm:mt-8 flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg sm:text-2xl font-black text-primary-foreground">GGI</span>
                  </div>
                  <div>
                    <p className="font-bold text-primary text-sm sm:text-lg">주식회사 지지아이 대표이사 차 경 희</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Women-Owned Business</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="bg-primary rounded-xl sm:rounded-2xl p-5 sm:p-6 text-primary-foreground">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <Award className="w-6 h-6 sm:w-8 sm:h-8 text-accent flex-shrink-0" />
                    <h3 className="font-bold text-base sm:text-lg">여성기업 인증</h3>
                  </div>
                  <p className="text-sm text-primary-foreground/80">
                    중소벤처기업부 인증 여성기업으로서 공공기관 우선구매 대상 기업입니다.
                  </p>
                </div>
                <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-border">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                    <h3 className="font-bold text-base sm:text-lg text-primary">전문 분야</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0"></span>
                      교육용 가구 (책상, 의자, 칠판보조장, 사물함)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0"></span>
                      사무용 가구 (워크스테이션, 회의용)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0"></span>
                      공공기관 맞춤 가구 솔루션
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
          {otherSections.map((section, idx) => (
            <section
              key={section.id}
              className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-start`}
            >
              {section.image_url && (
                <div className="w-full md:w-2/5 flex-shrink-0">
                  <img
                    src={section.image_url}
                    alt={section.title || ''}
                    className="w-full rounded-xl shadow-md object-cover aspect-[4/3]"
                  />
                </div>
              )}
              <div className={`flex-1 ${!section.image_url ? 'w-full' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    {sectionIcons[section.section_key] || <Building2 className="h-5 w-5" />}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {section.title}
                  </h2>
                </div>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
                  {section.content}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <section className="bg-primary/5 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h3 className="text-xl font-bold text-foreground mb-3">문의 및 견적 요청</h3>
            <p className="text-muted-foreground mb-6">제품에 대한 궁금한 점이나 견적이 필요하시면 언제든지 연락해 주세요.</p>
            <Link to="/inquiry">
              <Button size="lg" className="font-bold">견적/문의하기</Button>
            </Link>
          </div>
        </section>
      </main>
    </PageLayout>
  );
};

export default About;
