-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela de roles de usuário
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Criar função de segurança para verificar roles (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Criar tabela de logs de ações admin
CREATE TABLE public.admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all action logs"
ON public.admin_action_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert action logs"
ON public.admin_action_logs FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Adicionar dani@danibaidaeventos.com.br como admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'dani@danibaidaeventos.com.br'
ON CONFLICT (user_id, role) DO NOTHING;

-- Atualizar políticas RLS existentes para permitir acesso admin

-- Events: Admins podem ver todos os eventos
CREATE POLICY "Admins can view all events"
ON public.events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all events"
ON public.events FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Guests: Admins podem ver todos os convidados
CREATE POLICY "Admins can view all guests"
ON public.guests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all guests"
ON public.guests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- User Subscriptions: Admins podem ver todas as assinaturas
CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all subscriptions"
ON public.user_subscriptions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Event Purchases: Admins podem ver todas as compras
CREATE POLICY "Admins can view all purchases"
ON public.event_purchases FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all purchases"
ON public.event_purchases FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Tables: Admins podem ver todas as mesas
CREATE POLICY "Admins can view all tables"
ON public.tables FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));