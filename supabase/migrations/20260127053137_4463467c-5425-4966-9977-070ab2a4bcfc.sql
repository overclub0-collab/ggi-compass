-- Add thumbnail_index column to delivery_cases for admin-selected representative image
ALTER TABLE public.delivery_cases 
ADD COLUMN thumbnail_index integer DEFAULT 0;

-- Update the public view to include client_name and thumbnail_index
DROP VIEW IF EXISTS public.delivery_cases_public;

CREATE VIEW public.delivery_cases_public
WITH (security_invoker = on) AS
SELECT 
  id,
  client_name,
  product_name,
  model_name,
  images,
  thumbnail_index,
  display_order,
  is_active,
  created_at
FROM public.delivery_cases
WHERE is_active = true;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.delivery_cases_public TO anon;
GRANT SELECT ON public.delivery_cases_public TO authenticated;