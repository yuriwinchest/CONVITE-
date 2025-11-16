-- Criar tabela para carrinho de compras
CREATE TABLE IF NOT EXISTS public.shopping_cart (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shopping_cart ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own cart"
  ON public.shopping_cart
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart"
  ON public.shopping_cart
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart"
  ON public.shopping_cart
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart"
  ON public.shopping_cart
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_shopping_cart_updated_at
  BEFORE UPDATE ON public.shopping_cart
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();