-- ============================================
-- CORREÇÕES DE SEGURANÇA - GDPR E RLS
-- ============================================

-- 1. Adicionar política DELETE para profiles (GDPR - direito ao esquecimento)
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- 2. Adicionar política DELETE para user_roles (apenas admins)
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Adicionar política DELETE para event_purchases (usuários podem deletar próprias compras)
CREATE POLICY "Users can delete their own purchases"
ON public.event_purchases
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Adicionar política UPDATE para event_purchases (usuários podem atualizar próprias compras)
CREATE POLICY "Users can update their own purchases"
ON public.event_purchases
FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Tornar admin_action_logs append-only (previne tampering)
-- Criar trigger para prevenir UPDATE e DELETE
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER prevent_audit_log_update
BEFORE UPDATE ON public.admin_action_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER prevent_audit_log_delete
BEFORE DELETE ON public.admin_action_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();