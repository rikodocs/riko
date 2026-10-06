-- ============================================
-- RIKO - Migration V14: Sites (CNPJ + URL) em fila
-- Moderador cadastra a lista (CNPJ e URL separados). Cada operador pega
-- 1 site por vez: o que ele pegou sai da fila dos outros e fica com ele.
-- Acesso so pelo servidor (RLS ligado, sem policy publica).
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT NOT NULL,
  url TEXT NOT NULL,
  created_by UUID REFERENCES viewer_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_by UUID REFERENCES viewer_users(id),
  claimed_at TIMESTAMPTZ
);

-- Caso a tabela ja exista de uma versao anterior
ALTER TABLE sites ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES viewer_users(id);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_url ON sites (lower(url));
CREATE INDEX IF NOT EXISTS idx_sites_cnpj ON sites (cnpj);
CREATE INDEX IF NOT EXISTS idx_sites_queue ON sites (created_at) WHERE claimed_by IS NULL;
CREATE INDEX IF NOT EXISTS idx_sites_claimed_by ON sites (claimed_by);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
