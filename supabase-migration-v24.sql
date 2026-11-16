-- ============================================
-- RIKO - Migration V24: proxies com prazo
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- Quando o proxy vence (NULL = sem prazo)
ALTER TABLE proxies ADD COLUMN IF NOT EXISTS expira_em TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_proxies_expira ON proxies(expira_em) WHERE status = 'ativo';

-- Novo status: expirado (desativado automaticamente ao vencer)
ALTER TABLE proxies DROP CONSTRAINT IF EXISTS proxies_status_check;
ALTER TABLE proxies ADD CONSTRAINT proxies_status_check CHECK (status IN ('ativo', 'liberado', 'expirado'));
