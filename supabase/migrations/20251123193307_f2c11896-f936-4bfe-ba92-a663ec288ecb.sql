-- Criar função RPC para permitir upload de fotos por convidados não autenticados
CREATE OR REPLACE FUNCTION public.guest_upload_photo(
  p_event_id UUID,
  p_guest_id UUID,
  p_photo_url TEXT,
  p_file_name TEXT,
  p_file_size INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_photo_id UUID;
  v_guest_checked_in BOOLEAN;
BEGIN
  -- Verificar se o guest fez check-in (bypass RLS usando SECURITY DEFINER)
  SELECT (checked_in_at IS NOT NULL) INTO v_guest_checked_in
  FROM guests
  WHERE id = p_guest_id
  AND event_id = p_event_id;
  
  IF NOT v_guest_checked_in THEN
    RAISE EXCEPTION 'Guest has not checked in yet';
  END IF;
  
  -- Inserir a foto
  INSERT INTO event_photos (event_id, guest_id, photo_url, file_name, file_size)
  VALUES (p_event_id, p_guest_id, p_photo_url, p_file_name, p_file_size)
  RETURNING id INTO v_photo_id;
  
  RETURN v_photo_id;
END;
$$;