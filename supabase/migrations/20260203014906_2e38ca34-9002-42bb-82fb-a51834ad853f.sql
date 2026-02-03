-- Create catalogs table for multi-catalog management
CREATE TABLE public.catalogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  year INTEGER,
  pdf_url TEXT NOT NULL,
  thumbnail_url TEXT,
  priority INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalogs ENABLE ROW LEVEL SECURITY;

-- Public can view active catalogs
CREATE POLICY "Active catalogs are viewable by everyone" 
ON public.catalogs 
FOR SELECT 
USING (is_active = true);

-- Only admins can manage catalogs
CREATE POLICY "Only admins can insert catalogs" 
ON public.catalogs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update catalogs" 
ON public.catalogs 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete catalogs" 
ON public.catalogs 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add catalog_id to catalog_downloads for tracking per-catalog downloads
ALTER TABLE public.catalog_downloads 
ADD COLUMN catalog_id UUID REFERENCES public.catalogs(id) ON DELETE SET NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_catalogs_updated_at
BEFORE UPDATE ON public.catalogs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for catalog files
INSERT INTO storage.buckets (id, name, public) VALUES ('catalogs', 'catalogs', true);

-- Storage policies for catalog files
CREATE POLICY "Catalog files are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'catalogs');

CREATE POLICY "Only admins can upload catalog files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'catalogs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update catalog files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'catalogs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete catalog files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'catalogs' AND has_role(auth.uid(), 'admin'::app_role));