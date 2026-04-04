import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface BannerData {
  id: string;
  video_url: string | null;
  fallback_image_url: string | null;
  main_title: string | null;
  sub_title: string | null;
  animation_type: string | null;
  animation_speed: number | null;
  overlay_opacity: number | null;
}

const getAnimationVariants = (type: string, speed: number) => {
  const duration = speed || 1.2;
  switch (type) {
    case 'fade-up':
      return {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration, ease: 'easeOut' } },
      };
    case 'fade':
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration, ease: 'easeOut' } },
      };
    case 'slide':
      return {
        hidden: { opacity: 0, x: -60 },
        visible: { opacity: 1, x: 0, transition: { duration, ease: 'easeOut' } },
      };
    case 'zoom':
      return {
        hidden: { opacity: 0, scale: 0.85 },
        visible: { opacity: 1, scale: 1, transition: { duration, ease: 'easeOut' } },
      };
    default:
      return {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration, ease: 'easeOut' } },
      };
  }
};

const ProductBanner = () => {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchBanner = async () => {
      const { data } = await supabase
        .from('product_banners')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setBanner(data as BannerData);
    };
    fetchBanner();
  }, []);

  if (!banner) return null;

  const animType = banner.animation_type || 'fade-up';
  const animSpeed = banner.animation_speed || 1.2;
  const variants = getAnimationVariants(animType, animSpeed);

  return (
    <section className="relative overflow-hidden bg-primary/5">
      <div className="relative w-full" style={{ minHeight: '420px', maxHeight: '560px' }}>
        {/* Fallback Image */}
        {banner.fallback_image_url && (
          <img
            src={banner.fallback_image_url}
            alt="Banner"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? 'opacity-0' : 'opacity-100'}`}
          />
        )}

        {/* Video Background */}
        {banner.video_url && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          >
            <source src={banner.video_url} type="video/mp4" />
          </video>
        )}

        {/* Fallback gradient if no media */}
        {!banner.video_url && !banner.fallback_image_url && (
          <div className="absolute inset-0 bg-primary" />
        )}

        {/* Blue gradient overlay - matching About page style */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-primary/80" />

        {/* Text Layer */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-16 sm:py-24" style={{ minHeight: '420px' }}>
          {banner.main_title && (
            <motion.h1
              variants={variants}
              initial="hidden"
              animate="visible"
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary-foreground mb-4 drop-shadow-lg"
            >
              {banner.main_title}
            </motion.h1>
          )}
          {banner.sub_title && (
            <motion.p
              variants={variants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
              className="text-primary-foreground/90 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto drop-shadow"
            >
              {banner.sub_title}
            </motion.p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductBanner;
