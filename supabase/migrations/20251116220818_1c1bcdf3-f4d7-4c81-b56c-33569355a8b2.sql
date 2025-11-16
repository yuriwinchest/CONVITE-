-- Habilitar RLS na tabela event_photos
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- Permitir que qualquer pessoa (incluindo anon) insira fotos associadas a um convidado válido que fez check-in
CREATE POLICY "Convidados podem fazer upload de suas fotos"
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

-- Permitir que donos de eventos vejam todas as fotos do evento
CREATE POLICY "Donos podem ver fotos do evento"
ON public.event_photos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_photos.event_id
    AND events.user_id = auth.uid()
  )
);

-- Permitir que convidados vejam suas próprias fotos
CREATE POLICY "Convidados podem ver suas fotos"
ON public.event_photos
FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir uploads no bucket event-photos para qualquer pessoa (convidados)
CREATE POLICY "Qualquer pessoa pode fazer upload no bucket event-photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'event-photos');

-- Permitir que qualquer pessoa veja fotos do bucket (já que o bucket é público)
CREATE POLICY "Qualquer pessoa pode ver fotos do evento"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'event-photos');

-- Permitir que donos de eventos deletem fotos
CREATE POLICY "Donos podem deletar fotos do evento"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos' AND
  EXISTS (
    SELECT 1 FROM public.event_photos ep
    JOIN public.events e ON e.id = ep.event_id
    WHERE ep.photo_url LIKE '%' || storage.objects.name
    AND e.user_id = auth.uid()
  )
);