-- ============================================
-- RIKO - Migration V10: Gerador de PIX (Ativopay)
-- Token, CPF e telefone ficam salvos e fixos; so o valor muda a cada PIX.
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

ALTER TABLE settings ADD COLUMN IF NOT EXISTS pix_api_token TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS pix_cpf TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS pix_telefone TEXT DEFAULT '';
