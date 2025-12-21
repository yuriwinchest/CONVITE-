-- 1. Política para negar acesso anônimo na tabela guests
CREATE POLICY "Deny anonymous access to guests"
ON public.guests
FOR SELECT
TO anon
USING (false);

-- 2. Política para negar acesso anônimo na tabela user_subscriptions
CREATE POLICY "Deny anonymous access to user_subscriptions"
ON public.user_subscriptions
FOR SELECT
TO anon
USING (false);

-- 3. Política para negar acesso anônimo na tabela event_photos
CREATE POLICY "Deny anonymous access to event_photos"
ON public.event_photos
FOR SELECT
TO anon
USING (false);

-- 4. Política de INSERT para event_photos (apenas criadores de eventos podem inserir)
CREATE POLICY "Event creators can insert photos"
ON public.event_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_photos.event_id 
    AND events.user_id = auth.uid()
  )
);

-- 5. Política de INSERT para admins na tabela event_photos
CREATE POLICY "Admins can insert photos"
ON public.event_photos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));