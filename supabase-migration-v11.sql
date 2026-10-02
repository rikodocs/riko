-- ============================================
-- RIKO - Migration V11: Documentos baixados em ZIP pelo admin
--
-- Em Usuarios, o admin pode baixar um ZIP com N documentos do estoque livre.
-- Esses documentos saem do estoque com status "downloaded" (em vez de serem
-- atribuidos a um usuario).
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('available', 'rejected', 'used', 'downloaded'));

ALTER TABLE documents ADD COLUMN IF NOT EXISTS downloaded_at TIMESTAMPTZ;
