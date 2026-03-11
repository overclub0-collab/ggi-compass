
CREATE TABLE public.popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text,
  link_url text,
  width integer NOT NULL DEFAULT 500,
  height integer NOT NULL DEFAULT 600,
  position_x integer DEFAULT 100,
  position_y integer DEFAULT 100,
  is_active boolean DEFAULT false,
  display_order integer DEFAULT 0,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active popups" ON public.popups
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage popups" ON public.popups
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
