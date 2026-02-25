CREATE POLICY "Public can view consultations by id"
ON public.consultations
FOR SELECT
TO anon
USING (true);