-- Migração: Remover plano PROFESSIONAL e migrar usuários existentes
-- NOTA: Esta migração foi modificada para ser segura mesmo se as tabelas não existirem

-- 2. Remover políticas RLS que dependem da coluna plan temporariamente
DROP POLICY IF EXISTS "Guests can upload their own photos to premium events" ON event_photos;

-- Verificar se o tipo subscription_plan já existe antes de tentar modificá-lo
DO $$ 
BEGIN
  -- Se o tipo não existe, não fazer nada
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
    RAISE NOTICE 'Tipo subscription_plan não existe, pulando migração';
    RETURN;
  END IF;

  -- 1. Atualizar todos os usuários PROFESSIONAL para PREMIUM (se a tabela existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
    UPDATE user_subscriptions 
    SET plan = 'PREMIUM' 
    WHERE plan = 'PROFESSIONAL';
    
    -- 3. Remover defaults
    ALTER TABLE user_subscriptions ALTER COLUMN plan DROP DEFAULT;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_purchases') THEN
    UPDATE event_purchases 
    SET plan = 'PREMIUM' 
    WHERE plan = 'PROFESSIONAL';
    
    ALTER TABLE event_purchases ALTER COLUMN plan DROP DEFAULT;
  END IF;

  -- 4. Criar novo enum
  CREATE TYPE subscription_plan_new AS ENUM ('FREE', 'ESSENTIAL', 'PREMIUM');

  -- 5. Converter colunas (se existirem)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
    ALTER TABLE user_subscriptions 
      ALTER COLUMN plan TYPE subscription_plan_new 
      USING plan::text::subscription_plan_new;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_purchases') THEN
    ALTER TABLE event_purchases 
      ALTER COLUMN plan TYPE subscription_plan_new 
      USING plan::text::subscription_plan_new;
  END IF;

  -- 6. Remover enum antigo e renomear
  DROP TYPE subscription_plan;
  ALTER TYPE subscription_plan_new RENAME TO subscription_plan;

  -- 7. Restaurar defaults (se a tabela existir)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
    ALTER TABLE user_subscriptions 
      ALTER COLUMN plan SET DEFAULT 'FREE'::subscription_plan;
  END IF;

  -- 9. Adicionar comentário
  COMMENT ON TYPE subscription_plan IS 'Planos de assinatura: FREE (1 evento, 50 convidados), ESSENTIAL (R$79/evento, 200 convidados), PREMIUM (R$149/mês, 20 eventos/mês, convidados ilimitados)';
END $$;

-- 8. Recriar política RLS atualizada (REMOVIDA - será substituída pela nova migração)
-- Esta política será substituída pela migração 20251127142700_fix_guest_photo_upload.sql
-- que permite uploads anônimos