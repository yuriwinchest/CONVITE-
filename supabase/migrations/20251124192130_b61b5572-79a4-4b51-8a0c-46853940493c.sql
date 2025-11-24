-- Criar função RPC pública para verificar check-in de convidado
-- Permite que usuários não-autenticados verifiquem se um guest fez check-in
CREATE OR REPLACE FUNCTION public.verify_guest_checkin(
  p_guest_id UUID,
  p_event_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest RECORD;
BEGIN
  -- Buscar informações do guest (bypass RLS)
  SELECT id, name, checked_in_at
  INTO v_guest
  FROM guests
  WHERE id = p_guest_id
  AND event_id = p_event_id;
  
  -- Se guest não encontrado
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Guest not found'
    );
  END IF;
  
  -- Retornar informações
  RETURN jsonb_build_object(
    'success', true,
    'guest', jsonb_build_object(
      'id', v_guest.id,
      'name', v_guest.name,
      'checked_in_at', v_guest.checked_in_at,
      'has_checked_in', (v_guest.checked_in_at IS NOT NULL)
    )
  );
END;
$$;