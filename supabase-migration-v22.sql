-- ============================================
-- RIKO - Migration V22: permissões do moderador (Docs e proxy em lote)
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- true = moderador revisa/distribui documentos; false = não vê nada de Docs.
ALTER TABLE viewer_users ADD COLUMN IF NOT EXISTS acesso_docs BOOLEAN NOT NULL DEFAULT true;

-- Hustle Ads não tem acesso aos Docs
UPDATE viewer_users SET acesso_docs = false WHERE email = 'hustleads@hustleads.com.br';

-- true = moderador pode gerar proxies em lote (várias de uma vez).
ALTER TABLE viewer_users ADD COLUMN IF NOT EXISTS proxy_lote BOOLEAN NOT NULL DEFAULT false;
