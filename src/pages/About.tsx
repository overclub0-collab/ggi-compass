import { useEffect, useState, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Award, History, Eye, MessageSquare, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import heroFallback from '@/assets/about-hero-video-poster.jpg';

interface CompanySection {
  id: string;
  section_key: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  display_order: number;
  text_animation: string | null;
}

const sectionIcons: Record<string, React.ReactNode> = {
  hero: <Building2 className="h-6 w-6" />,
  greeting: <MessageSquare className="h-6 w-6" />,
  vision: <Eye className="h-6 w-6" />,
  history: <History className="h-6 w-6" />,
  certifications: <Award className="h-6 w-6" />,
};

const getAnimationVariants = (type: string | null) => {
  switch (type) {
    case 'fade-up':
      return { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
    case 'fade-down':
      return { hidden: { opacity: 0, y: -40 }, visible: { opacity: 1, y: 0 } };
    case 'fade-left':
      return { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } };
    case 'fade-right':
      return { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0 } };
    case 'zoom-in':
      return { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } };
    case 'blur-in':
      return { hidden: { opacity: 0, filter: 'blur(12px)' }, visible: { opacity: 1, filter: 'blur(0px)' } };
    case 'bounce-in':
      return {
        hidden: { opacity: 0, scale: 0.5 },
        visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 15 } },
      };
    case 'stagger':
    case 'typewriter':
      return { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
    default:
      return { hidden: { opacity: 1 }, visible: { opacity: 1 } };
  }
};

const AnimatedText = ({ text, animation }: { text: string; animation: string | null }) => {
  if (animation === 'stagger' || animation === 'typewriter') {
    const chars = text.split('');
    return (
      <motion.span
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        transition={{ staggerChildren: animation === 'typewriter' ? 0.04 : 0.03 }}
      >
        {chars.map((char, i) => (
          <motion.span
            key={i}
            variants={{
              hidden: { opacity: 0, y: animation === 'typewriter' ? 0 : 10 },
              visible: { opacity: 1, y: 0 },
            }}
            className="inline-block"
            style={{ whiteSpace: char === ' ' ? 'pre' : undefined }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.span>
    );
  }

  const variants = getAnimationVariants(animation);
  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={variants}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="block"
    >
      {text}
    </motion.span>
  );
};

const AnimatedBlock = ({ children, animation, delay = 0 }: { children: React.ReactNode; animation: string | null; delay?: number }) => {
  const variants = getAnimationVariants(animation);
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={variants}
      transition={{ duration: 0.7, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
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
      if (data) setSections(data as unknown as CompanySection[]);
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

  const heroVideoUrl = heroSection?.video_url;
  const heroImageUrl = heroSection?.image_url || heroFallback;
  const heroAnimation = heroSection?.text_animation || 'fade-up';

  return (
    <PageLayout>
      <main className="pt-20">
        {/* Hero Banner with Video/Image */}
        <section className="relative overflow-hidden bg-primary/5">
          <div className="relative w-full" style={{ minHeight: '420px', maxHeight: '560px' }}>
            {heroVideoUrl ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                poster={heroImageUrl}
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={heroVideoUrl} type="video/mp4" />
              </video>
            ) : (
              <img
                src={heroImageUrl}
                alt="회사 대표 이미지"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-primary/80" />
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-16 sm:py-24" style={{ minHeight: '420px' }}>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary-foreground mb-4 drop-shadow-lg">
                <AnimatedText text={heroSection?.title || '주식회사 지지아이'} animation={heroAnimation} />
              </h1>
              {heroSection?.content && (
                <AnimatedBlock animation={heroAnimation} delay={0.3}>
                  <p className="text-primary-foreground/90 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto whitespace-pre-line drop-shadow">
                    {heroSection.content}
                  </p>
                </AnimatedBlock>
              )}
            </div>
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
          {otherSections.map((section, idx) => {
            const anim = section.text_animation || 'none';
            return (
              <section
                key={section.id}
                className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-start`}
              >
                {section.image_url && (
                  <AnimatedBlock animation={anim === 'none' ? 'fade-up' : anim} delay={0.1}>
                    <div className="w-full md:w-auto flex-shrink-0">
                      <img
                        src={section.image_url}
                        alt={section.title || ''}
                        className="w-full rounded-xl shadow-md object-cover aspect-[4/3]"
                      />
                    </div>
                  </AnimatedBlock>
                )}
                <div className={`flex-1 ${!section.image_url ? 'w-full' : ''}`}>
                  <AnimatedBlock animation={anim} delay={0}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                        {sectionIcons[section.section_key] || <Building2 className="h-5 w-5" />}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                        {anim === 'stagger' || anim === 'typewriter' ? (
                          <AnimatedText text={section.title || ''} animation={anim} />
                        ) : (
                          section.title
                        )}
                      </h2>
                    </div>
                  </AnimatedBlock>
                  <AnimatedBlock animation={anim} delay={0.2}>
                    <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
                      {section.content}
                    </div>
                  </AnimatedBlock>
                </div>
              </section>
            );
          })}
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
