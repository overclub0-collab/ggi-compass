
CREATE OR REPLACE FUNCTION public.increment_catalog_downloads(p_catalog_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE catalogs 
  SET download_count = COALESCE(download_count, 0) + 1 
  WHERE id = p_catalog_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_catalog_downloads TO anon, authenticated;
