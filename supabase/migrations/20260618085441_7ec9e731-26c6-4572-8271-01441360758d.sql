
-- 1. Fix furniture_analysis_cache: restrict INSERT/UPDATE to admins
DROP POLICY IF EXISTS "Only admins can insert furniture analysis" ON public.furniture_analysis_cache;
DROP POLICY IF EXISTS "Only admins can update furniture analysis" ON public.furniture_analysis_cache;

CREATE POLICY "Only admins can insert furniture analysis"
ON public.furniture_analysis_cache
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update furniture analysis"
ON public.furniture_analysis_cache
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Add admin SELECT policy on inquiry_rate_limits for auditing
CREATE POLICY "Admins can view inquiry rate limits"
ON public.inquiry_rate_limits
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Revoke execute on internal SECURITY DEFINER helper functions
-- has_role: only used by RLS policy expressions internally; no need to expose via API
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, PUBLIC;

-- update_updated_at_column / set_product_thumbnail: trigger functions only
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_product_thumbnail() FROM anon, authenticated, PUBLIC;

-- handle_new_user_admin_role: trigger function on auth.users
REVOKE EXECUTE ON FUNCTION public.handle_new_user_admin_role() FROM anon, authenticated, PUBLIC;

-- increment_catalog_downloads is intentionally callable from client; keep grants
GRANT EXECUTE ON FUNCTION public.increment_catalog_downloads(uuid) TO anon, authenticated;
