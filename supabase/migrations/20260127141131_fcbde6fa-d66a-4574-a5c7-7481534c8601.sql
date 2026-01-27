-- Remove políticas de upload anônimo/público no bucket event-photos
-- Apenas a edge function (usando service_role) pode fazer upload

-- Remover todas as políticas de INSERT que permitem upload direto
DROP POLICY IF EXISTS "Allow anonymous upload to event-photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload event photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to event-photos" ON storage.objects;

-- NOTA: A edge function upload-event-photo usa SUPABASE_SERVICE_ROLE_KEY
-- que tem bypass automático de RLS, então não precisa de política de INSERT

-- Manter apenas política de leitura pública para visualização das fotos
-- (já deve existir, mas garantindo)
DROP POLICY IF EXISTS "Photos are publicly accessible" ON storage.objects;
CREATE POLICY "Photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-photos');