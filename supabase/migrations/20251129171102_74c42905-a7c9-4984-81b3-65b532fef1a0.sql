-- Política para permitir INSERT anônimo no bucket event-photos
-- Isso permite que convidados façam upload de fotos via Edge Function

DROP POLICY IF EXISTS "Allow anonymous upload to event-photos" ON storage.objects;

CREATE POLICY "Allow anonymous upload to event-photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'event-photos');