-- Criar bucket para mapas de eventos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-maps', 'event-maps', true);

-- RLS Policy: Apenas criadores autenticados podem fazer upload
CREATE POLICY "Users can upload event maps"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-maps' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Criadores podem atualizar seus próprios mapas
CREATE POLICY "Users can update their event maps"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-maps' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Criadores podem deletar seus próprios mapas
CREATE POLICY "Users can delete their event maps"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-maps' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Permitir leitura pública das imagens
CREATE POLICY "Anyone can view event maps"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-maps');

-- Adicionar coluna table_map_url na tabela events
ALTER TABLE events ADD COLUMN table_map_url TEXT;

-- Remover função antiga e criar nova versão com table_map_url
DROP FUNCTION IF EXISTS public.get_public_event_details(uuid);

CREATE FUNCTION public.get_public_event_details(p_event_id uuid)
RETURNS TABLE(
  id uuid, 
  name text, 
  date timestamp with time zone, 
  location text, 
  description text,
  table_map_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.date,
    e.location,
    e.description,
    e.table_map_url
  FROM events e
  WHERE e.id = p_event_id;
END;
$$;