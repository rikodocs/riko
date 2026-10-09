-- ============================================
-- RIKO - Migration V17: Modelos (fichas de palavras-chave, titulos e descricoes)
-- Moderador cadastra fichas e liga cada uma a um operador da equipe dele.
-- Operador ve as fichas dele em /operacao e copia os itens.
-- Acesso so pelo servidor (RLS ligado, sem policy publica).
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderador_id UUID NOT NULL REFERENCES viewer_users(id),
  operador_id UUID REFERENCES viewer_users(id),
  nome TEXT NOT NULL,
  palavras_chave TEXT[] NOT NULL DEFAULT '{}',
  titulos TEXT[] NOT NULL DEFAULT '{}',
  descricoes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modelos_moderador ON modelos (moderador_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_modelos_operador ON modelos (operador_id);

ALTER TABLE modelos ENABLE ROW LEVEL SECURITY;
