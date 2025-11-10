-- Create RPC function for searching guest by name (case-insensitive, trimmed)
CREATE OR REPLACE FUNCTION public.search_guest_by_name(
  p_event_id uuid,
  p_name text
)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  table_number integer,
  confirmed boolean,
  event_name text,
  event_date timestamp with time zone,
  event_location text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.email,
    g.table_number,
    g.confirmed,
    e.name as event_name,
    e.date as event_date,
    e.location as event_location
  FROM guests g
  INNER JOIN events e ON e.id = g.event_id
  WHERE g.event_id = p_event_id
    AND LOWER(TRIM(g.name)) LIKE LOWER(TRIM(p_name)) || '%'
  LIMIT 1;
END;
$$;

-- Create RPC function for confirming guest presence
CREATE OR REPLACE FUNCTION public.confirm_guest_presence(
  p_guest_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest_name text;
  v_table_number integer;
  v_event_id uuid;
  v_event_name text;
  v_creator_email text;
  v_result jsonb;
BEGIN
  -- Update guest confirmation
  UPDATE guests
  SET confirmed = true
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
$$;

-- Create RPC function to get public event details
CREATE OR REPLACE FUNCTION public.get_public_event_details(
  p_event_id uuid
)
RETURNS TABLE (
  id uuid,
  name text,
  date timestamp with time zone,
  location text,
  description text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.date,
    e.location,
    e.description
  FROM events e
  WHERE e.id = p_event_id;
END;
$$;