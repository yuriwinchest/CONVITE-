-- Remover políticas problemáticas que expõem fotos publicamente
DROP POLICY IF EXISTS "Acesso público para galeria de convidados" ON public.event_photos;
DROP POLICY IF EXISTS "Public can upload event photos" ON public.event_photos;
DROP POLICY IF EXISTS "Guests can delete their own photos" ON public.event_photos;

-- Remover políticas duplicadas
DROP POLICY IF EXISTS "Criadores podem deletar fotos" ON public.event_photos;
DROP POLICY IF EXISTS "Criadores veem todas as fotos do evento" ON public.event_photos;

-- Criar função SECURITY DEFINER para verificar acesso às fotos do evento
CREATE OR REPLACE FUNCTION public.check_event_photos_access(p_event_id uuid, p_guest_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_creator boolean := false;
  v_is_admin boolean := false;
  v_guest_checked_in boolean := false;
BEGIN
  -- Verificar se é admin
  IF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    ) INTO v_is_admin;
    
    IF v_is_admin THEN
      RETURN true;
    END IF;
    
    -- Verificar se é criador do evento
    SELECT EXISTS (
      SELECT 1 FROM events WHERE id = p_event_id AND user_id = auth.uid()
    ) INTO v_is_creator;
    
    IF v_is_creator THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Verificar se o guest_id fornecido fez check-in no evento
  IF p_guest_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM guests 
      WHERE id = p_guest_id 
      AND event_id = p_event_id 
      AND checked_in_at IS NOT NULL
    ) INTO v_guest_checked_in;
    
    RETURN v_guest_checked_in;
  END IF;
  
  RETURN false;
END;
$$;

-- Criar função para buscar fotos do evento de forma segura
CREATE OR REPLACE FUNCTION public.get_event_photos(p_event_id uuid, p_guest_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  event_id uuid,
  guest_id uuid,
  photo_url text,
  file_name text,
  file_size integer,
  uploaded_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar acesso
  IF NOT check_event_photos_access(p_event_id, p_guest_id) THEN
    RAISE EXCEPTION 'Access denied to event photos';
  END IF;
  
  -- Retornar fotos do evento
  RETURN QUERY
  SELECT 
    ep.id,
    ep.event_id,
    ep.guest_id,
    ep.photo_url,
    ep.file_name,
    ep.file_size,
    ep.uploaded_at,
    ep.created_at
  FROM event_photos ep
  WHERE ep.event_id = p_event_id
  ORDER BY ep.uploaded_at DESC;
END;
$$;