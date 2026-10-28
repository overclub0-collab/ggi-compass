GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

DO $$
BEGIN
  IF NOT has_function_privilege('authenticated', 'public.has_role(uuid,public.app_role)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Authenticated role checks must be executable';
  END IF;
  IF NOT has_function_privilege('anon', 'public.has_role(uuid,public.app_role)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Public RLS policies must be able to evaluate role checks';
  END IF;
END;
$$;