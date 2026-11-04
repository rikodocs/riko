-- ============================================
-- RIKO - Migration V21: Proxy por fornecedor (Riko x Hustle Ads)
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- Quem usa chave própria de proxy. NULL = chave padrão da Riko.
-- Operadores herdam do moderador (viewer_users.moderador_id).
ALTER TABLE viewer_users ADD COLUMN IF NOT EXISTS proxy_provider TEXT;

-- De qual chave saiu cada proxy (pra cada equipe ver só o seu histórico)
ALTER TABLE proxies ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'riko';
CREATE INDEX IF NOT EXISTS idx_proxies_provider ON proxies(provider, created_at DESC);

-- Marca o moderador Hustle Ads. Confira o resultado do SELECT antes:
--   SELECT id, name, role FROM viewer_users WHERE name ILIKE '%hustle%';
UPDATE viewer_users SET proxy_provider = 'hustleads'
WHERE role = 'moderador' AND name ILIKE '%hustle%';
