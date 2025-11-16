-- Remover políticas antigas conflitantes que usavam auth.uid() incorretamente para guest_id
DROP POLICY IF EXISTS "Guests can view their own photos" ON public.event_photos;
DROP POLICY IF EXISTS "Guests can upload their own photos to premium events" ON public.event_photos;

-- Remover políticas duplicadas que criamos
DROP POLICY IF EXISTS "Convidados podem fazer upload de suas fotos" ON public.event_photos;
DROP POLICY IF EXISTS "Donos podem ver fotos do evento" ON public.event_photos;
DROP POLICY IF EXISTS "Convidados podem ver suas fotos" ON public.event_photos;

-- Criar políticas corretas para convidados não autenticados
-- Permitir que convidados que fizeram check-in possam fazer upload de fotos
CREATE POLICY "Convidados checked-in podem fazer upload"
ON public.event_photos
FOR INSERT
TO anon, authenticated
WITH CHECK (
  guest_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.guests
    WHERE guests.id = event_photos.guest_id
    AND guests.checked_in_at IS NOT NULL
  )
);

-- Permitir que qualquer pessoa veja fotos (já que a galeria é pública)
CREATE POLICY "Fotos são públicas"
ON public.event_photos
FOR SELECT
TO anon, authenticated
USING (true);