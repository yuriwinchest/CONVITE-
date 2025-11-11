-- Habilitar realtime para a tabela guests
ALTER TABLE public.guests REPLICA IDENTITY FULL;

-- Adicionar tabela guests à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;