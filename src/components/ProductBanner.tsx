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

  const overlayOpacity = banner.overlay_opacity ?? 0.3;
  const animType = banner.animation_type || 'fade-up';
  const animSpeed = banner.animation_speed || 1.2;
  const variants = getAnimationVariants(animType, animSpeed);

  return (
    <div className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] overflow-hidden rounded-2xl mb-8">
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
          src={banner.video_url}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}

      {/* Fallback gradient if no media */}
      {!banner.video_url && !banner.fallback_image_url && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40" />
      )}

      {/* Dark Overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      />

      {/* Text Layer */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center z-10">
        {banner.main_title && (
          <motion.h2
            variants={variants}
            initial="hidden"
            animate="visible"
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-white drop-shadow-lg mb-4"
          >
            {banner.main_title}
          </motion.h2>
        )}
        {banner.sub_title && (
          <motion.p
            variants={variants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="text-base sm:text-xl lg:text-2xl text-white/90 drop-shadow-md max-w-2xl"
          >
            {banner.sub_title}
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default ProductBanner;
