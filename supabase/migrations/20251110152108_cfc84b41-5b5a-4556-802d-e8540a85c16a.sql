-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  location TEXT,
  capacity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create guests table
CREATE TABLE public.guests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  table_number INTEGER,
  confirmed BOOLEAN DEFAULT false,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tables table (for event seating)
CREATE TABLE public.tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, table_number)
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Users can view their own events"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON public.events FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for guests
CREATE POLICY "Users can view guests from their events"
  ON public.guests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = guests.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert guests to their events"
  ON public.guests FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = guests.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "Users can update guests from their events"
  ON public.guests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = guests.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete guests from their events"
  ON public.guests FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = guests.event_id
    AND events.user_id = auth.uid()
  ));

-- RLS Policies for tables
CREATE POLICY "Users can view tables from their events"
  ON public.tables FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = tables.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert tables to their events"
  ON public.tables FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = tables.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "Users can update tables from their events"
  ON public.tables FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = tables.event_id
    AND events.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete tables from their events"
  ON public.tables FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = tables.event_id
    AND events.user_id = auth.uid()
  ));

-- Trigger to update updated_at on events
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();