-- Função RPC pública para buscar convidados por nome (bypass RLS)
CREATE OR REPLACE FUNCTION public.search_guests_by_name(
  p_event_id UUID,
  p_name TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_results jsonb;
BEGIN
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'email', g.email,
        'checked_in_at', g.checked_in_at
      )
    ), '[]'::jsonb
  ) INTO v_results
  FROM (
    SELECT id, name, email, checked_in_at
    FROM guests
    WHERE event_id = p_event_id
      AND name ILIKE '%' || p_name || '%'
    ORDER BY name ASC
    LIMIT p_limit
  ) g;

  RETURN v_results;
END;
$$;