-- ============================================
-- RIKO - Migration V7: Simplifica status dos documentos
-- Execute este SQL no SQL Editor do Supabase
--
-- Nao ha mais processamento automatico por IA/OCR. Documentos ficam
-- "available" assim que sao enviados; o usuario (via /painel) decide se
-- fica "used" (aceitou e cadastrou uma pessoa) ou "rejected" (recusou).
-- ============================================

-- Remapeia os dados existentes para os novos valores
UPDATE documents SET status = 'available' WHERE status IN ('pending', 'manual_review', 'error');
UPDATE documents SET status = 'used' WHERE status = 'consulted';
UPDATE documents SET status = 'rejected' WHERE status = 'duplicate';

-- Troca a constraint pros 3 valores novos
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('available', 'rejected', 'used'));

ALTER TABLE documents ALTER COLUMN status SET DEFAULT 'available';

-- Indice antigo de manual_review nao serve mais
DROP INDEX IF EXISTS idx_documents_manual_review;
