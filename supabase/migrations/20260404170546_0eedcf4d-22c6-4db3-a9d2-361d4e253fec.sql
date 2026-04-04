
CREATE TABLE public.product_banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_url text,
  fallback_image_url text,
  main_title text DEFAULT '주요 제품',
  sub_title text DEFAULT '최고의 품질, 친환경 가구 솔루션',
  animation_type text DEFAULT 'fade-up',
  animation_speed numeric DEFAULT 1.2,
  overlay_opacity numeric DEFAULT 0.3,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active product banners"
ON public.product_banners
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage product banners"
ON public.product_banners
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_product_banners_updated_at
BEFORE UPDATE ON public.product_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
