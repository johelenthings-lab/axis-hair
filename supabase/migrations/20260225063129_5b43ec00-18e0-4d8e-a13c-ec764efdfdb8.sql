
-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stylist_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stylists can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = stylist_id);

CREATE POLICY "Stylists can insert their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = stylist_id);

CREATE POLICY "Stylists can update their own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = stylist_id);

CREATE POLICY "Stylists can delete their own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = stylist_id);

-- Create consultations table
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stylist_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  hair_texture TEXT,
  desired_length TEXT,
  face_shape TEXT,
  maintenance_level TEXT,
  lifestyle TEXT,
  inspiration_notes TEXT,
  status TEXT NOT NULL DEFAULT 'photo_uploaded',
  estimated_price NUMERIC,
  appointment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stylists can view their own consultations"
  ON public.consultations FOR SELECT
  USING (auth.uid() = stylist_id);

CREATE POLICY "Stylists can insert their own consultations"
  ON public.consultations FOR INSERT
  WITH CHECK (auth.uid() = stylist_id);

CREATE POLICY "Stylists can update their own consultations"
  ON public.consultations FOR UPDATE
  USING (auth.uid() = stylist_id);

CREATE POLICY "Stylists can delete their own consultations"
  ON public.consultations FOR DELETE
  USING (auth.uid() = stylist_id);

-- Add updated_at trigger for consultations
CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
