-- Create delivery_cases table for 납품사례
CREATE TABLE public.delivery_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL, -- 납품처명 (필수)
  product_name TEXT, -- 품명 (선택)
  model_name TEXT, -- 모델명 (선택)
  identifier TEXT, -- 식별번호 (선택)
  images TEXT[] DEFAULT '{}'::TEXT[], -- 이미지 배열
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_cases ENABLE ROW LEVEL SECURITY;

-- Public can view active cases
CREATE POLICY "Delivery cases are viewable by everyone"
ON public.delivery_cases
FOR SELECT
USING (is_active = true);

-- Only admins can insert
CREATE POLICY "Only admins can insert delivery cases"
ON public.delivery_cases
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Only admins can update delivery cases"
ON public.delivery_cases
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Only admins can delete delivery cases"
ON public.delivery_cases
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_delivery_cases_updated_at
BEFORE UPDATE ON public.delivery_cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();