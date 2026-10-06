-- ============================================
-- RIKO - Migration V13: Moderador entra com e-mail e senha
-- A senha fica guardada como hash (scrypt), nunca em texto puro.
-- O moderador e criado pelo admin em Usuarios (nao por SQL).
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

ALTER TABLE viewer_users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE viewer_users ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_viewer_users_email
  ON viewer_users (lower(email)) WHERE email IS NOT NULL;
