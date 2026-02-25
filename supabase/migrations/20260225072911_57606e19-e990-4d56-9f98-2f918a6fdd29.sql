ALTER TABLE public.consultations
ADD COLUMN ai_recommendation text,
ADD COLUMN ai_generated_at timestamp with time zone;