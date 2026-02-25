-- Add preview_status to track AI image generation state
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS preview_status TEXT DEFAULT 'idle';

-- Values: 'idle' | 'generating' | 'done' | 'error'
