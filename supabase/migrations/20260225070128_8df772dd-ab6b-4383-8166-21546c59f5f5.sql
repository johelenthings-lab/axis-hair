-- Create private storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('consultation-images', 'consultation-images', false);

-- Stylists can upload files to their own folder
CREATE POLICY "Stylists can upload their own consultation images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'consultation-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Stylists can view their own files
CREATE POLICY "Stylists can view their own consultation images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'consultation-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Stylists can update their own files
CREATE POLICY "Stylists can update their own consultation images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'consultation-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Stylists can delete their own files
CREATE POLICY "Stylists can delete their own consultation images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'consultation-images' AND auth.uid()::text = (storage.foldername(name))[1]);