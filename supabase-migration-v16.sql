-- ============================================
-- RIKO - Migration V16: Equipe (operador -> moderador), contas e financeiro
--
-- Operador sobe a planilha de contas (mesmo formato da Mikey Ads) na Riko;
-- tudo fica ligado ao moderador responsavel por ele. Moderador baixa o .xlsx
-- (formato AdsPower) pra subir na Mikey Ads com a conta dele.
-- Financeiro moderador -> operador fica aqui: taxa R$/conta por produto,
-- pagamentos registrados, a receber = soma(valor das contas) - pago.
-- Acesso so pelo servidor (RLS ligado, sem policy publica).
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- Operador pertence a um moderador
ALTER TABLE viewer_users ADD COLUMN IF NOT EXISTS moderador_id UUID REFERENCES viewer_users(id);
CREATE INDEX IF NOT EXISTS idx_viewer_users_moderador ON viewer_users (moderador_id);

-- Produtos (tipos de conta) sao do moderador
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderador_id UUID NOT NULL REFERENCES viewer_users(id),
  titulo TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_produtos_moderador ON produtos (moderador_id);
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

-- Contas subidas pelos operadores
CREATE TABLE IF NOT EXISTS contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderador_id UUID NOT NULL REFERENCES viewer_users(id),
  operador_id UUID NOT NULL REFERENCES viewer_users(id),
  produto_id UUID NOT NULL REFERENCES produtos(id),
  source_key TEXT NOT NULL,
  cnpj TEXT,
  login TEXT,
  senha TEXT,
  dois_fatores TEXT,
  cookies TEXT,
  proxy TEXT,
  ua TEXT,
  import_extra JSONB,
  -- Valor que o moderador paga por esta conta, congelado na hora do upload
  -- (taxa do operador x produto naquele momento; 0 se ainda nao tinha taxa).
  valor_centavos INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'nova' CHECK (status IN ('nova', 'baixada')),
  baixada_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (moderador_id, source_key)
);
CREATE INDEX IF NOT EXISTS idx_contas_operador ON contas (operador_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contas_moderador_status ON contas (moderador_id, status, produto_id);
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;

-- Taxa R$/conta que o moderador paga a cada operador, por produto
CREATE TABLE IF NOT EXISTS taxas_operador (
  operador_id UUID NOT NULL REFERENCES viewer_users(id),
  produto_id UUID NOT NULL REFERENCES produtos(id),
  valor_centavos INTEGER NOT NULL DEFAULT 0 CHECK (valor_centavos >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (operador_id, produto_id)
);
ALTER TABLE taxas_operador ENABLE ROW LEVEL SECURITY;

-- Pagamentos que o moderador registrou pro operador
CREATE TABLE IF NOT EXISTS pagamentos_operador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderador_id UUID NOT NULL REFERENCES viewer_users(id),
  operador_id UUID NOT NULL REFERENCES viewer_users(id),
  valor_centavos INTEGER NOT NULL CHECK (valor_centavos > 0),
  obs TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pagamentos_operador ON pagamentos_operador (operador_id, created_at DESC);
ALTER TABLE pagamentos_operador ENABLE ROW LEVEL SECURITY;
