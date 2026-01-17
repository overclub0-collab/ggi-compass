-- Create function to auto-assign admin role for specific emails
CREATE OR REPLACE FUNCTION public.handle_new_user_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'admin@ggicompass.com',
    'admin@example.com'
  ];
BEGIN
  -- Check if the new user's email is in the admin list
  IF NEW.email = ANY(admin_emails) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created_admin_check
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_admin_role();