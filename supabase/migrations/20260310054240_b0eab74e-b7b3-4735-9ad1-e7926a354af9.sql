
-- Add reference_images and ai_generated_images columns to furniture_analysis_cache
ALTER TABLE public.furniture_analysis_cache 
  ADD COLUMN IF NOT EXISTS reference_images text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ai_generated_images text[] DEFAULT '{}'::text[];

-- Create storage bucket for furniture reference images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('furniture-references', 'furniture-references', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for furniture-references bucket
CREATE POLICY "Public read access for furniture references"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'furniture-references');

-- Admin insert access
CREATE POLICY "Admin insert furniture references"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'furniture-references' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Admin delete access
CREATE POLICY "Admin delete furniture references"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'furniture-references' 
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete from furniture_analysis_cache
CREATE POLICY "Only admins can delete furniture analysis"
ON public.furniture_analysis_cache
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
