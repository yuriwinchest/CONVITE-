-- Corrigir política de upload do Storage para permitir uploads anônimos
-- Isso é necessário para que convidados possam enviar fotos sem estar logados

-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Anyone can upload event photos" ON storage.objects;
DROP POLICY IF EXISTS "Event photos upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access" ON storage.objects;

-- Criar política que permite upload para QUALQUER usuário (autenticado ou anônimo)
CREATE POLICY "Allow anonymous upload to event-photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'event-photos');

-- Garantir que a política de leitura também existe
DROP POLICY IF EXISTS "Photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

CREATE POLICY "Allow public read from event-photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-photos');

-- Garantir que criadores de eventos podem deletar fotos
DROP POLICY IF EXISTS "Event creators can delete photos" ON storage.objects;

CREATE POLICY "Allow event creators to delete photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND EXISTS (
    SELECT 1
    FROM public.event_photos ep
    JOIN public.events e ON e.id = ep.event_id
    WHERE e.user_id = auth.uid()
    AND (storage.foldername(name))[1] = e.id::text
  )
);
