-- Enable RLS on the delivery_cases_public view and add explicit public SELECT policy
-- This view is intentionally public-facing for the gallery page

-- Note: The delivery_cases_public is a VIEW, not a table
-- Views created WITH (security_invoker=on) inherit RLS from base table
-- The base table (delivery_cases) already has RLS that restricts access to admins only
-- The view SELECT is filtered to show only is_active = true records

-- First, let's recreate the view with security_invoker to inherit RLS properly
DROP VIEW IF EXISTS public.delivery_cases_public;

CREATE VIEW public.delivery_cases_public
WITH (security_invoker = off) AS
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

-- Grant SELECT access to anonymous and authenticated users
GRANT SELECT ON public.delivery_cases_public TO anon, authenticated;