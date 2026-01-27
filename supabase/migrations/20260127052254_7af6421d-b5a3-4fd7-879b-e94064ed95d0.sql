-- Fix delivery_cases RLS: Change from public readable to admin-only for SELECT
-- This protects sensitive client information (military units, school names)

-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Delivery cases are viewable by everyone" ON public.delivery_cases;

-- Create a new policy that only allows admins to view delivery cases
-- Public users will access via a view or API that filters sensitive data
CREATE POLICY "Only admins can view delivery cases" 
ON public.delivery_cases 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a public view that only exposes non-sensitive fields for public display
-- This allows the public page to still work while hiding sensitive identifiers
CREATE OR REPLACE VIEW public.delivery_cases_public
WITH (security_invoker = on) AS
SELECT 
  id,
  product_name,
  model_name,
  images,
  display_order,
  is_active,
  created_at
FROM public.delivery_cases
WHERE is_active = true;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.delivery_cases_public TO anon;
GRANT SELECT ON public.delivery_cases_public TO authenticated;