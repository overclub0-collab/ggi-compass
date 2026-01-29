-- Add CHECK constraints for input length validation on inquiries table
-- These constraints enforce the same limits as the edge function at the database level

ALTER TABLE public.inquiries 
ADD CONSTRAINT inquiries_name_length_check 
CHECK (length(name) <= 100);

ALTER TABLE public.inquiries 
ADD CONSTRAINT inquiries_phone_length_check 
CHECK (length(phone) <= 20);

ALTER TABLE public.inquiries 
ADD CONSTRAINT inquiries_email_length_check 
CHECK (length(email) <= 255);

ALTER TABLE public.inquiries 
ADD CONSTRAINT inquiries_title_length_check 
CHECK (length(title) <= 200);

ALTER TABLE public.inquiries 
ADD CONSTRAINT inquiries_content_length_check 
CHECK (length(content) <= 5000);

ALTER TABLE public.inquiries 
ADD CONSTRAINT inquiries_password_length_check 
CHECK (length(password) <= 255);