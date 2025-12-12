-- Atualizar a função confirm_guest_presence para também definir checked_in_at
CREATE OR REPLACE FUNCTION public.confirm_guest_presence(p_guest_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_guest_name text;
  v_table_number integer;
  v_event_id uuid;
  v_event_name text;
  v_creator_email text;
  v_result jsonb;
BEGIN
  -- Update guest confirmation AND set checked_in_at if not already set
  UPDATE guests
  SET 
    confirmed = true,
    checked_in_at = COALESCE(checked_in_at, now())
  WHERE id = p_guest_id
  RETURNING name, table_number, event_id INTO v_guest_name, v_table_number, v_event_id;
  
  -- Get event details and creator email
  SELECT 
    e.name,
    p.user_id::text
  INTO v_event_name, v_creator_email
  FROM events e
  LEFT JOIN profiles p ON p.user_id = e.user_id
  WHERE e.id = v_event_id;
  
  -- Return data for notification
  v_result := jsonb_build_object(
    'guestName', v_guest_name,
    'tableNumber', v_table_number,
    'eventId', v_event_id,
    'eventName', v_event_name,
    'creatorUserId', v_creator_email
  );
  
  RETURN v_result;
END;
$function$;