-- ============================================
-- RIKO - Migration V23: acesso do moderador por aba
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

ALTER TABLE viewer_users ADD COLUMN IF NOT EXISTS acesso_sites BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE viewer_users ADD COLUMN IF NOT EXISTS acesso_ferramentas BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE viewer_users ADD COLUMN IF NOT EXISTS acesso_equipe BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE viewer_users ADD COLUMN IF NOT EXISTS acesso_proxies BOOLEAN NOT NULL DEFAULT true;

-- Hustle Ads: só Proxies
UPDATE viewer_users
SET acesso_docs = false, acesso_sites = false, acesso_ferramentas = false, acesso_equipe = false, acesso_proxies = true
WHERE email = 'hustleads@hustleads.com.br';
