-- Remover política antiga que requeria check-in
DROP POLICY IF EXISTS "Convidados checked-in podem fazer upload" ON public.event_photos;

-- Nova política: Permitir INSERT público (qualquer pessoa pode inserir)
-- A validação de Premium será feita na aplicação/edge function
CREATE POLICY "Public can upload event photos"
ON public.event_photos FOR INSERT
WITH CHECK (true);

-- Garantir que convidados podem deletar apenas suas próprias fotos
DROP POLICY IF EXISTS "Convidados podem deletar suas fotos" ON public.event_photos;

CREATE POLICY "Guests can delete their own photos"
ON public.event_photos FOR DELETE
USING (guest_id IS NOT NULL);