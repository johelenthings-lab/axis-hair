CREATE POLICY "Public can view client names via consultation"
ON public.clients
FOR SELECT
TO anon
USING (true);