-- ============================================
-- RIKO - Migration V12: Moderador + Operacao
--
-- Novo fluxo:
--   upload -> pending_review (aguardando moderacao)
--   moderador digita CPF, consulta, salva a pessoa -> available (aprovado, no estoque)
--   moderador recusa -> rejected_mod (fica anotado, nada e apagado)
--   moderador atribui pros operadores -> available + assigned_to
--   operador baixa -> downloaded
--
-- viewer_users ganha papel: 'moderador' ou 'operador'.
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- Papel dos usuarios (quem ja existe vira operador)
ALTER TABLE viewer_users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'operador';
ALTER TABLE viewer_users DROP CONSTRAINT IF EXISTS viewer_users_role_check;
ALTER TABLE viewer_users ADD CONSTRAINT viewer_users_role_check
  CHECK (role IN ('moderador', 'operador'));

-- Novos status
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;
ALTER TABLE documents ADD CONSTRAINT documents_status_check
  CHECK (status IN ('pending_review', 'available', 'rejected', 'rejected_mod', 'used', 'downloaded'));
ALTER TABLE documents ALTER COLUMN status SET DEFAULT 'pending_review';

-- Trava de revisao (varios moderadores nao pegam o mesmo doc) e registro de quem moderou
ALTER TABLE documents ADD COLUMN IF NOT EXISTS review_claimed_by UUID REFERENCES viewer_users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS review_claimed_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES viewer_users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS downloaded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_documents_pending_review ON documents(created_at) WHERE status = 'pending_review';

-- Todo o estoque atual (inclusive o que estava com os antigos ligadores)
-- volta pra fila de moderacao. Nada que ja foi usado/rejeitado muda.
UPDATE documents
SET status = 'pending_review', assigned_to = NULL, assigned_at = NULL
WHERE status = 'available';
