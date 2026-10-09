-- ============================================
-- RIKO - Migration V15: Ferramentas de OPC (trazidas da Mikey Ads)
--   - Chave da Anthropic em settings (gerador de site + respostas OPC)
--   - Casos de OPC: historico das respostas geradas e se aprovou/recusou
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

ALTER TABLE settings ADD COLUMN IF NOT EXISTS anthropic_api_key TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS anthropic_modelo TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS opc_casos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa TEXT,
  cnpj TEXT,
  dominio TEXT,
  site_html TEXT,
  respostas JSONB,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'em_analise', 'aprovado', 'rejeitado')),
  motivo_recusa TEXT,
  created_by UUID REFERENCES viewer_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opc_casos_status ON opc_casos (status, created_at DESC);

-- Acesso so pelo servidor (service role). Sem policy publica.
ALTER TABLE opc_casos ENABLE ROW LEVEL SECURITY;
