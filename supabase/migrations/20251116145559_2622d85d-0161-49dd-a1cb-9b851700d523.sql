-- Atualizar RLS policies para galerias privadas por convidado

-- Remover policies antigas
DROP POLICY IF EXISTS "Guests can upload photos to premium events" ON event_photos;
DROP POLICY IF EXISTS "Users can view photos from their events" ON event_photos;
DROP POLICY IF EXISTS "Event creators can delete photos" ON event_photos;

-- Convidados podem inserir suas próprias fotos (apenas eventos Premium)
CREATE POLICY "Guests can upload their own photos to premium events"
ON event_photos FOR INSERT
WITH CHECK (
  guest_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM events e
    LEFT JOIN event_purchases ep ON ep.event_id = e.id AND ep.payment_status = 'paid'
    WHERE e.id = event_photos.event_id
    AND ep.plan = 'PREMIUM'
  )
);

-- Convidados podem ver apenas suas próprias fotos
CREATE POLICY "Guests can view their own photos"
ON event_photos FOR SELECT
USING (guest_id = auth.uid());

-- Criadores de eventos podem ver todas as fotos dos seus eventos
CREATE POLICY "Event creators can view all event photos"
ON event_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_photos.event_id
    AND events.user_id = auth.uid()
  )
);

-- Criadores de eventos podem deletar fotos
CREATE POLICY "Event creators can delete event photos"
ON event_photos FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_photos.event_id
    AND events.user_id = auth.uid()
  )
);

-- Admins mantém acesso total
-- (policy "Admins can view all photos" já existe)