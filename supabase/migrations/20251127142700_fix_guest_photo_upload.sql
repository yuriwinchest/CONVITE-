-- Corrigir política de upload de fotos para permitir convidados anônimos
-- O problema é que a política atual verifica auth.uid() que não existe para usuários anônimos

-- 1. Remover política existente que requer autenticação
DROP POLICY IF EXISTS "Guests can upload their own photos to premium events" ON event_photos;
DROP POLICY IF EXISTS "Allow guest photo uploads" ON event_photos;
DROP POLICY IF EXISTS "Allow anonymous guest photo uploads" ON event_photos;

-- 2. Criar nova política que permite INSERT para qualquer pessoa (anônimo ou autenticado)
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

-- 3. Garantir política de leitura pública
DROP POLICY IF EXISTS "Anyone can view event photos" ON event_photos;
DROP POLICY IF EXISTS "Public can view event photos" ON event_photos;

CREATE POLICY "Public can view event photos"
ON event_photos
FOR SELECT
TO public
USING (true);

-- 4. Garantir que criadores de eventos podem deletar fotos
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

-- 5. Garantir que RLS está habilitado
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
