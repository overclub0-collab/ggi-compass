
-- Add images array column to company_info for multiple image support
ALTER TABLE public.company_info ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}'::text[];

-- Migrate existing image_url data to images array
UPDATE public.company_info 
SET images = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND image_url != '' AND (images IS NULL OR array_length(images, 1) IS NULL);
