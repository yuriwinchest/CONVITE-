-- Enable unaccent extension for accent-insensitive search
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Update search_guest_by_name function to handle accents
CREATE OR REPLACE FUNCTION public.search_guest_by_name(p_event_id uuid, p_name text)
RETURNS TABLE(
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
SET search_path TO 'public'
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
    AND unaccent(LOWER(TRIM(g.name))) LIKE unaccent(LOWER(TRIM(p_name))) || '%'
  LIMIT 1;
END;
$$;