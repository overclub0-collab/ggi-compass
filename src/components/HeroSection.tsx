import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, BadgeCheck, Building2, Leaf, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CatalogDownloadButton } from '@/components/CatalogDownloadButton';
import { motion, AnimatePresence } from 'framer-motion';
import heroClassroom from '@/assets/hero-classroom.jpg';
import heroOffice from '@/assets/hero-office.png';
import heroLounge from '@/assets/hero-lounge.png';

const SLIDES = [
{ image: heroClassroom, alt: 'GGI 교육 환경' },
{ image: heroOffice, alt: 'GGI 오피스 환경' },
{ image: heroLounge, alt: 'GGI 라운지 환경' }];


const features = [
{ icon: BadgeCheck, title: '여성기업', description: '공공기관 우선구매 및 수의계약 혜택 적용 기업' },
{ icon: Building2, title: '나라장터 등록', description: '조달청 MAS 정식 등록을 통한 투명한 계약 프로세스' },
{ icon: Leaf, title: '친환경 E0', description: '최고 등급 친환경 소재만을 사용하는 학생 중심 철학' },
{ icon: ShieldCheck, title: '품질 보증', description: '조달청 품질검사를 통과한 신뢰의 제품' }];


// Ken Burns variants – each slide gets a unique zoom/pan direction
const kenBurnsVariants = [
{ initial: { scale: 1.0, x: '0%', y: '0%' }, animate: { scale: 1.15, x: '-2%', y: '-1%' } },
{ initial: { scale: 1.15, x: '2%', y: '1%' }, animate: { scale: 1.0, x: '0%', y: '0%' } },
{ initial: { scale: 1.0, x: '1%', y: '2%' }, animate: { scale: 1.12, x: '-1%', y: '-2%' } }];


const SLIDE_DURATION = 6000;

// Staggered text reveal component
const StaggeredText = ({ text, className = '', delay = 0 }: {text: string;className?: string;delay?: number;}) =>
<span className={`inline-flex overflow-hidden ${className}`}>
    {text.split('').map((char, i) =>
  <motion.span
    key={i}
    initial={{ y: '110%', opacity: 0, filter: 'blur(6px)' }}
    animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
    transition={{ duration: 0.5, delay: delay + i * 0.03, ease: [0.22, 1, 0.36, 1] }}
    className="inline-block">
    
        {char === ' ' ? '\u00A0' : char}
      </motion.span>
  )}
  </span>;


export const HeroSection = () => {
  const [current, setCurrent] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const kb = kenBurnsVariants[current % kenBurnsVariants.length];

  return (
    <section id="hero" className="relative min-h-screen overflow-hidden">
      {/* Cinematic Ken Burns Slider */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}>
          
          <motion.div
            className="absolute inset-0 bg-cover bg-center will-change-transform"
            style={{ backgroundImage: `url(${SLIDES[current].image})` }}
            initial={{ scale: kb.initial.scale, x: kb.initial.x, y: kb.initial.y }}
            animate={{ scale: kb.animate.scale, x: kb.animate.x, y: kb.animate.y }}
            transition={{ duration: SLIDE_DURATION / 1000, ease: 'linear' }} />
          
        </motion.div>
      </AnimatePresence>

      {/* Blue overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/50" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block px-3 sm:px-4 py-1.5 bg-accent text-accent-foreground text-xs font-bold rounded-full mb-6 sm:mb-8 uppercase tracking-widest">
            
            Professional Education Furniture
          </motion.div>

          <div className="mb-6 sm:mb-8">
            <h1 className="heading-fluid-xl font-black text-white leading-tight tracking-tight">
              <span className="text-accent font-black">G</span><StaggeredText text="lobal" delay={0.4} /><br />
              <span className="text-accent font-black">G</span><StaggeredText text="reat" delay={0.7} /><br />
              <span className="text-accent font-black">I</span><StaggeredText text="ntelligent Furniture" delay={1.0} />
            </h1>
            {/* Accent G letters overlay */}
            <div className="heading-fluid-xl font-black leading-tight tracking-tight absolute pointer-events-none" style={{ top: 'inherit' }}>
            </div>
          </div>

          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 sm:mb-10 leading-relaxed"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 1.6 }}>미래 교육 공간의 표준, 전문 제조 여성기업 
사무용·교육용·반려동물 가구의 전문성을 하나로
GGI가 더 나은 내일의 공간을 만듭니다.<br className="hidden sm:block" />
            <span className="text-accent font-semibold">GGI</span>가 만드는 미래 교육의 기반입니다.
          </motion.p>

          {/* Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2.0 }}>
            
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base shadow-lg w-full sm:w-auto justify-center" onClick={() => window.open('https://shop.g2b.go.kr/', '_blank')}>
              <ExternalLink className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>조달청 나라장터 바로가기</span>
            </Button>
            <CatalogDownloadButton variant="hero" />
          </motion.div>

          <CatalogDownloadButton variant="fixed" />
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute z-10 bottom-48 sm:bottom-52 lg:bottom-56 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, i) =>
        <button
          key={i}
          onClick={() => setCurrent(i)}
          className={`h-1 rounded-full transition-all duration-500 ${
          i === current ? 'w-8 bg-accent' : 'w-3 bg-white/40 hover:bg-white/60'}`
          } />

        )}
      </div>

      {/* Feature Cards */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 md:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map((feature, index) =>
          <motion.div
            key={feature.title}
            className="bg-white/90 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all group"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.2 + index * 0.1 }}>
            
              <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-accent mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-1 sm:mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

};