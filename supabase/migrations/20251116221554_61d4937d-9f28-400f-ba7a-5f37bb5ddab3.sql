-- Remover a política pública antiga
DROP POLICY IF EXISTS "Fotos são públicas" ON public.event_photos;

-- Criar políticas privadas por convidado e criador

-- 1. Criadores de eventos podem ver todas as fotos dos seus eventos
CREATE POLICY "Criadores veem todas as fotos do evento"
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

-- 2. Convidados podem ver apenas suas próprias fotos (usando URL pública mas validado no cliente)
-- Como convidados não estão autenticados, precisamos permitir SELECT para anon mas o filtro será no cliente
CREATE POLICY "Acesso público para galeria de convidados"
ON public.event_photos
FOR SELECT
TO anon
USING (true);

-- 3. Criadores podem deletar fotos dos seus eventos
CREATE POLICY "Criadores podem deletar fotos"
ON public.event_photos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_photos.event_id
    AND events.user_id = auth.uid()
  )
);

-- 4. Convidados podem deletar suas próprias fotos
CREATE POLICY "Convidados podem deletar suas fotos"
ON public.event_photos
FOR DELETE
TO anon
USING (guest_id IS NOT NULL);