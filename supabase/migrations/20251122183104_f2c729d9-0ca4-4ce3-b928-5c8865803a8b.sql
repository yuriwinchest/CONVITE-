-- Função para verificar se um evento tem privilégios premium
-- Considera: criador admin OU event_purchase PREMIUM
CREATE OR REPLACE FUNCTION public.check_event_photo_access(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id uuid;
  v_is_admin boolean := false;
  v_has_premium_purchase boolean := false;
BEGIN
  -- Buscar o criador do evento
  SELECT user_id INTO v_creator_id
  FROM events
  WHERE id = p_event_id;
  
  IF v_creator_id IS NULL THEN
    -- Evento não existe
    RETURN jsonb_build_object(
      'canUpload', false,
      'plan', 'FREE'
    );
  END IF;
  
  -- Verificar se o criador tem role admin
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = v_creator_id
      AND role = 'admin'
  ) INTO v_is_admin;
  
  -- Se é admin, retornar PREMIUM
  IF v_is_admin THEN
    RETURN jsonb_build_object(
      'canUpload', true,
      'plan', 'PREMIUM'
    );
  END IF;
  
  -- Verificar se existe compra PREMIUM para o evento
  SELECT EXISTS (
    SELECT 1
    FROM event_purchases
    WHERE event_id = p_event_id
      AND plan = 'PREMIUM'
      AND payment_status = 'paid'
  ) INTO v_has_premium_purchase;
  
  IF v_has_premium_purchase THEN
    RETURN jsonb_build_object(
      'canUpload', true,
      'plan', 'PREMIUM'
    );
  END IF;
  
  -- Verificar se o usuário criador tem assinatura PREMIUM
  SELECT EXISTS (
    SELECT 1
    FROM user_subscriptions
    WHERE user_id = v_creator_id
      AND plan = 'PREMIUM'
      AND (subscription_status = 'active' OR subscription_status IS NULL)
  ) INTO v_has_premium_purchase;
  
  IF v_has_premium_purchase THEN
    RETURN jsonb_build_object(
      'canUpload', true,
      'plan', 'PREMIUM'
    );
  END IF;
  
  -- Default: FREE
  RETURN jsonb_build_object(
    'canUpload', false,
    'plan', 'FREE'
  );
END;
$$;