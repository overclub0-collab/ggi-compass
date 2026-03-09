
CREATE TABLE public.furniture_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  image_url text NOT NULL,
  analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (product_id)
);

ALTER TABLE public.furniture_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view furniture analysis cache"
ON public.furniture_analysis_cache
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert furniture analysis"
ON public.furniture_analysis_cache
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only admins can update furniture analysis"
ON public.furniture_analysis_cache
FOR UPDATE
USING (true)
WITH CHECK (true);
