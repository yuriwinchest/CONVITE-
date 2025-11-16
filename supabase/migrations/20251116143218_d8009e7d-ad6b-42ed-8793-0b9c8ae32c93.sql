-- Criar tabela para armazenar fotos dos eventos
CREATE TABLE IF NOT EXISTS public.event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON public.event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_guest_id ON public.event_photos(guest_id);

-- Habilitar RLS
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- RLS: Usuários podem ver fotos dos seus eventos
CREATE POLICY "Users can view photos from their events"
ON public.event_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_photos.event_id
    AND events.user_id = auth.uid()
  )
);

-- RLS: Convidados podem inserir fotos apenas em eventos Premium/Professional
CREATE POLICY "Guests can upload photos to premium events"
ON public.event_photos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    LEFT JOIN public.event_purchases ep ON ep.event_id = e.id AND ep.payment_status = 'paid'
    LEFT JOIN public.user_subscriptions us ON us.user_id = e.user_id
    WHERE e.id = event_photos.event_id
    AND (
      ep.plan IN ('PREMIUM', 'PROFESSIONAL')
      OR us.plan = 'PROFESSIONAL'
    )
  )
);

-- RLS: Admins podem ver todas as fotos
CREATE POLICY "Admins can view all photos"
ON public.event_photos FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS: Criadores podem deletar fotos dos seus eventos
CREATE POLICY "Event creators can delete photos"
ON public.event_photos FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_photos.event_id
    AND events.user_id = auth.uid()
  )
);

-- Criar bucket de storage para fotos de eventos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Qualquer um pode fazer upload
CREATE POLICY "Anyone can upload event photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-photos');

-- Storage Policy: Fotos são públicas para visualização
CREATE POLICY "Photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-photos');

-- Storage Policy: Criador do evento pode deletar fotos
CREATE POLICY "Event creators can delete photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-photos'
  AND EXISTS (
    SELECT 1
    FROM public.event_photos ep
    JOIN public.events e ON e.id = ep.event_id
    WHERE e.user_id = auth.uid()
  )
);