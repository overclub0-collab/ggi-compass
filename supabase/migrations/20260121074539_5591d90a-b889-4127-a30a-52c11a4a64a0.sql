-- Create inquiries table for contact/quote requests
CREATE TABLE public.inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  admin_reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  privacy_agreed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Public can insert (for non-member submissions)
CREATE POLICY "Anyone can create inquiries"
ON public.inquiries
FOR INSERT
WITH CHECK (true);

-- Public can only view their own inquiries (verified by phone + password)
-- This will be handled via edge function for security
CREATE POLICY "Inquiries are not publicly viewable"
ON public.inquiries
FOR SELECT
USING (false);

-- Admin can view all inquiries
CREATE POLICY "Admins can view all inquiries"
ON public.inquiries
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can update inquiries
CREATE POLICY "Admins can update inquiries"
ON public.inquiries
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin can delete inquiries
CREATE POLICY "Admins can delete inquiries"
ON public.inquiries
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_inquiries_updated_at
BEFORE UPDATE ON public.inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create rate limiting table for spam prevention
CREATE TABLE public.inquiry_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inquiry_rate_limits ENABLE ROW LEVEL SECURITY;

-- Anyone can insert rate limit records
CREATE POLICY "Anyone can insert rate limits"
ON public.inquiry_rate_limits
FOR INSERT
WITH CHECK (true);

-- Only system can read (via edge function with service role)
CREATE POLICY "Rate limits are not publicly viewable"
ON public.inquiry_rate_limits
FOR SELECT
USING (false);

-- Create index for rate limiting queries
CREATE INDEX idx_inquiry_rate_limits_ip_created 
ON public.inquiry_rate_limits (ip_address, created_at DESC);

-- Create index for admin queries
CREATE INDEX idx_inquiries_status_created 
ON public.inquiries (status, created_at DESC);