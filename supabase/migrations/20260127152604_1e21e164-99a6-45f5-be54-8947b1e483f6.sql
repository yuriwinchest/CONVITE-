-- Fix 1: Update search_guest_by_name to escape LIKE wildcards and return minimal data (no email)
CREATE OR REPLACE FUNCTION public.search_guest_by_name(p_event_id uuid, p_name text)
 RETURNS TABLE(id uuid, name text, email text, table_number integer, confirmed boolean, event_name text, event_date timestamp with time zone, event_location text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sanitized_name text;
BEGIN
  -- Escape LIKE wildcards to prevent pattern injection
  v_sanitized_name := REPLACE(REPLACE(REPLACE(p_name, '\', '\\'), '%', '\%'), '_', '\_');
  
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    NULL::text as email,  -- Don't expose email to prevent PII leakage
    g.table_number,
    g.confirmed,
    e.name as event_name,
    e.date as event_date,
    e.location as event_location
  FROM guests g
  INNER JOIN events e ON e.id = g.event_id
  WHERE g.event_id = p_event_id
    AND unaccent(LOWER(TRIM(g.name))) LIKE unaccent(LOWER(TRIM(v_sanitized_name))) || '%'
  LIMIT 1;
END;
$function$;

-- Fix 2: Update confirm_guest_presence to validate that the guest belongs to a valid event
-- and add basic protection against random UUID guessing by checking event exists
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
  v_event_date timestamptz;
  v_creator_user_id uuid;
  v_result jsonb;
  v_now timestamptz := now();
BEGIN
  -- First, validate that the guest exists and get event info
  SELECT g.name, g.table_number, g.event_id, e.name, e.date, e.user_id
  INTO v_guest_name, v_table_number, v_event_id, v_event_name, v_event_date, v_creator_user_id
  FROM guests g
  INNER JOIN events e ON e.id = g.event_id
  WHERE g.id = p_guest_id;
  
  -- If guest not found, return error
  IF v_guest_name IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Guest not found',
      'success', false
    );
  END IF;
  
  -- Check if event has already ended (8 hours after start)
  IF v_now > v_event_date + INTERVAL '8 hours' THEN
    RETURN jsonb_build_object(
      'error', 'Check-in period has ended',
      'success', false
    );
  END IF;
  
  -- Check if check-in is too early (before event date)
  IF v_now < v_event_date THEN
    RETURN jsonb_build_object(
      'error', 'Check-in not yet available',
      'success', false
    );
  END IF;
  
  -- Update guest confirmation AND set checked_in_at if not already set
  UPDATE guests
  SET 
    confirmed = true,
    checked_in_at = COALESCE(checked_in_at, v_now)
  WHERE id = p_guest_id;
  
  -- Return data for notification
  v_result := jsonb_build_object(
    'guestName', v_guest_name,
    'tableNumber', v_table_number,
    'eventId', v_event_id,
    'eventName', v_event_name,
    'creatorUserId', v_creator_user_id::text,
    'success', true
  );
  
  RETURN v_result;
END;
$function$;

-- Fix 3: Create a secure function for guest global search that returns minimal data
-- and only returns guests from active/upcoming events (not past events)
CREATE OR REPLACE FUNCTION public.search_guest_across_events(p_name text, p_limit integer DEFAULT 5)
 RETURNS TABLE(
   guest_id uuid,
   guest_name text,
   event_id uuid,
   event_name text,
   event_date timestamp with time zone,
   event_location text,
   table_number integer,
   confirmed boolean
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sanitized_name text;
  v_now timestamptz := now();
BEGIN
  -- Escape LIKE wildcards to prevent pattern injection
  v_sanitized_name := REPLACE(REPLACE(REPLACE(p_name, '\', '\\'), '%', '\%'), '_', '\_');
  
  -- Only return guests from events that are:
  -- 1. Not more than 8 hours in the past (check-in window)
  -- 2. Not more than 30 days in the future
  RETURN QUERY
  SELECT 
    g.id as guest_id,
    g.name as guest_name,
    e.id as event_id,
    e.name as event_name,
    e.date as event_date,
    e.location as event_location,
    g.table_number,
    g.confirmed
  FROM guests g
  INNER JOIN events e ON e.id = g.event_id
  WHERE unaccent(LOWER(TRIM(g.name))) LIKE '%' || unaccent(LOWER(TRIM(v_sanitized_name))) || '%'
    AND e.date > v_now - INTERVAL '8 hours'  -- Only active events
    AND e.date < v_now + INTERVAL '30 days'  -- Not too far in future
  ORDER BY e.date ASC
  LIMIT LEAST(p_limit, 10);  -- Cap at 10 results maximum
END;
$function$;