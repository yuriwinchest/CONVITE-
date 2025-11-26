-- Remover políticas antigas de INSERT muito permissivas no bucket event-photos
DROP POLICY IF EXISTS "Anyone can upload event photos" ON storage.objects;
DROP POLICY IF EXISTS "Qualquer pessoa pode fazer upload no bucket event-photos" ON storage.objects;

-- Atualizar bucket com restrições de tamanho e tipo de arquivo
UPDATE storage.buckets 
SET 
  file_size_limit = 10485760, -- 10MB em bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'event-photos';

-- Nota: A partir de agora, uploads devem ser feitos através da edge function 
-- 'upload-event-photo' que usa service_role e valida o convidado