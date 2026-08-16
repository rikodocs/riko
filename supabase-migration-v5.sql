-- ============================================
-- RIKO - Migration V5: Provedor de consulta de CPF selecionável
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

ALTER TABLE settings ADD COLUMN IF NOT EXISTS api_provider TEXT DEFAULT 'owndata';

UPDATE settings SET api_provider = 'owndata' WHERE api_provider IS NULL;
