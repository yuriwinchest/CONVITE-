-- Migração: Remover plano PROFESSIONAL e migrar usuários existentes

-- 1. Atualizar todos os usuários PROFESSIONAL para PREMIUM
UPDATE user_subscriptions 
SET plan = 'PREMIUM' 
WHERE plan = 'PROFESSIONAL';

UPDATE event_purchases 
SET plan = 'PREMIUM' 
WHERE plan = 'PROFESSIONAL';

-- 2. Remover políticas RLS que dependem da coluna plan temporariamente
DROP POLICY IF EXISTS "Guests can upload their own photos to premium events" ON event_photos;

-- 3. Remover defaults
ALTER TABLE user_subscriptions ALTER COLUMN plan DROP DEFAULT;
ALTER TABLE event_purchases ALTER COLUMN plan DROP DEFAULT;

-- 4. Criar novo enum
CREATE TYPE subscription_plan_new AS ENUM ('FREE', 'ESSENTIAL', 'PREMIUM');

-- 5. Converter colunas
ALTER TABLE user_subscriptions 
  ALTER COLUMN plan TYPE subscription_plan_new 
  USING plan::text::subscription_plan_new;

ALTER TABLE event_purchases 
  ALTER COLUMN plan TYPE subscription_plan_new 
  USING plan::text::subscription_plan_new;

-- 6. Remover enum antigo e renomear
DROP TYPE subscription_plan;
ALTER TYPE subscription_plan_new RENAME TO subscription_plan;

-- 7. Restaurar defaults
ALTER TABLE user_subscriptions 
  ALTER COLUMN plan SET DEFAULT 'FREE'::subscription_plan;

-- 8. Recriar política RLS atualizada
CREATE POLICY "Guests can upload their own photos to premium events" 
ON event_photos 
FOR INSERT 
WITH CHECK (
  (guest_id = auth.uid()) AND 
  (EXISTS (
    SELECT 1
    FROM events e
    LEFT JOIN event_purchases ep ON ep.event_id = e.id AND ep.payment_status = 'paid'
    WHERE e.id = event_photos.event_id 
    AND ep.plan = 'PREMIUM'
  ))
);

-- 9. Adicionar comentário
COMMENT ON TYPE subscription_plan IS 'Planos de assinatura: FREE (1 evento, 50 convidados), ESSENTIAL (R$79/evento, 200 convidados), PREMIUM (R$149/mês, 20 eventos/mês, convidados ilimitados)';