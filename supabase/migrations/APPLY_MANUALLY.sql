-- ============================================================================
-- SCRIPT PARA APLICAR MANUALMENTE NO SUPABASE DASHBOARD
-- ============================================================================
-- Este script corrige as políticas RLS para permitir que convidados anônimos
-- façam upload de fotos sem precisar estar autenticados.
--
-- INSTRUÇÕES:
-- 1. Acesse: https://zjmvpvxteixzbnjazplp.supabase.co/project/zjmvpvxteixzbnjazplp/sql/new
-- 2. Cole TODO este script
-- 3. Clique em "Run" para executar
-- ============================================================================

-- PASSO 1: Corrigir políticas de STORAGE (bucket event-photos)
-- ============================================================================

-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Anyone can upload event photos" ON storage.objects;
DROP POLICY IF EXISTS "Event photos upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous upload to event-photos" ON storage.objects;
DROP POLICY IF EXISTS "Qualquer pessoa pode fazer upload no bucket event-photos" ON storage.objects;

-- Criar política que permite upload para QUALQUER usuário (autenticado ou anônimo)
CREATE POLICY "Allow anonymous upload to event-photos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'event-photos');

-- Garantir que a política de leitura também existe
DROP POLICY IF EXISTS "Photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from event-photos" ON storage.objects;

CREATE POLICY "Allow public read from event-photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-photos');

-- Garantir que usuários autenticados podem deletar fotos
DROP POLICY IF EXISTS "Event creators can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete photos" ON storage.objects;

CREATE POLICY "Allow authenticated users to delete photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-photos');


-- PASSO 2: Corrigir políticas da TABELA event_photos
-- ============================================================================

-- Remover política existente que requer autenticação
DROP POLICY IF EXISTS "Guests can upload their own photos to premium events" ON event_photos;
DROP POLICY IF EXISTS "Allow guest photo uploads" ON event_photos;
DROP POLICY IF EXISTS "Allow anonymous guest photo uploads" ON event_photos;

-- Criar nova política que permite INSERT para qualquer pessoa (anônimo ou autenticado)
-- desde que o guest_id exista na tabela event_guests
CREATE POLICY "Allow anonymous guest photo uploads"
ON event_photos
FOR INSERT
TO public
WITH CHECK (
  -- Verificar se o guest_id existe e está associado ao evento correto
  EXISTS (
    SELECT 1
    FROM event_guests eg
    WHERE eg.id = event_photos.guest_id
    AND eg.event_id = event_photos.event_id
  )
);

-- Garantir política de leitura pública
DROP POLICY IF EXISTS "Anyone can view event photos" ON event_photos;
DROP POLICY IF EXISTS "Public can view event photos" ON event_photos;

CREATE POLICY "Public can view event photos"
ON event_photos
FOR SELECT
TO public
USING (true);

-- Garantir que criadores de eventos podem deletar fotos
DROP POLICY IF EXISTS "Event creators can delete photos" ON event_photos;
DROP POLICY IF EXISTS "Creators can delete event photos" ON event_photos;

CREATE POLICY "Creators can delete event photos"
ON event_photos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM events e
    WHERE e.id = event_photos.event_id
    AND e.user_id = auth.uid()
  )
);

-- Garantir que RLS está habilitado
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;


-- PASSO 3: Verificar configurações do bucket
-- ============================================================================

-- Atualizar bucket com restrições de tamanho e tipo de arquivo
UPDATE storage.buckets 
SET 
  file_size_limit = 10485760, -- 10MB em bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
  public = true -- Garantir que o bucket é público
WHERE id = 'event-photos';


-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
-- Após executar este script, teste o upload de fotos como convidado.
-- O erro "new row violates row-level security policy" deve ser resolvido.
-- ============================================================================
