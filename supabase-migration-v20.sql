-- ============================================
-- RIKO - Migration V20: Proxies IPv6 (Mikey Ads)
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS proxies (
  id TEXT PRIMARY KEY,                 -- id devolvido pela Mikey Ads
  viewer_id UUID REFERENCES viewer_users(id) ON DELETE SET NULL,
  viewer_name TEXT,
  ref TEXT,                            -- e-mail/ID da conta que vai usar o proxy
  host TEXT,
  porta INTEGER,
  login TEXT,
  senha TEXT,
  ip TEXT,
  protocolo TEXT DEFAULT 'socks5',
  conexao TEXT NOT NULL,               -- host:porta:login:senha (colar no AdsPower)
  url TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'liberado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  liberado_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_proxies_viewer ON proxies(viewer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proxies_status ON proxies(status);

ALTER TABLE proxies ENABLE ROW LEVEL SECURITY;  -- acesso só pela rota do servidor (service role)
