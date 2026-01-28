-- Fix the auto-admin race condition by requiring a specific email domain or whitelist
-- This prevents attackers from racing to become the first admin

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create an improved function that requires admin email verification
-- The admin must have a specific email pattern to be auto-assigned admin role
CREATE OR REPLACE FUNCTION public.handle_new_user_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_email_pattern TEXT := '%@ggigagu.com'; -- Only ggigagu.com emails can become admin
  allowed_admin_emails TEXT[] := ARRAY['ggigagu@naver.com']; -- Or explicit whitelist
BEGIN
  -- Check if this is the first user AND email matches whitelist or pattern
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  ) THEN
    -- Only assign admin if email is in explicit whitelist OR matches pattern
    IF NEW.email = ANY(allowed_admin_emails) OR NEW.email LIKE admin_email_pattern THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
      
      RAISE LOG 'Auto-assigned admin role to verified email: %', NEW.email;
    ELSE
      RAISE LOG 'Rejected auto-admin for unverified email: %', NEW.email;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_admin_role();