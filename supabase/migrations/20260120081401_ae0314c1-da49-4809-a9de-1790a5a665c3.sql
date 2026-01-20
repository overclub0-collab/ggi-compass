-- Add images array column for multi-image support (up to 3 images per product)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}'::text[];

-- Add comment for documentation
COMMENT ON COLUMN public.products.images IS 'Array of image URLs, maximum 3 images. First image is used as thumbnail.';

-- Update thumbnail_url to be auto-populated from first image if not set
-- Create a function to set thumbnail from first image
CREATE OR REPLACE FUNCTION public.set_product_thumbnail()
RETURNS TRIGGER AS $$
BEGIN
  -- If images array has items and thumbnail_url is null or empty, set from first image
  IF array_length(NEW.images, 1) > 0 AND (NEW.thumbnail_url IS NULL OR NEW.thumbnail_url = '') THEN
    NEW.thumbnail_url := NEW.images[1];
  END IF;
  
  -- Also set image_url from first image for backwards compatibility
  IF array_length(NEW.images, 1) > 0 AND (NEW.image_url IS NULL OR NEW.image_url = '') THEN
    NEW.image_url := NEW.images[1];
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic thumbnail setting
DROP TRIGGER IF EXISTS set_product_thumbnail_trigger ON public.products;
CREATE TRIGGER set_product_thumbnail_trigger
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_product_thumbnail();