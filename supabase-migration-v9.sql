-- ============================================
-- RIKO - Migration V9: Corrige documentos recusados antes da correção do bug
--
-- Ate agora, "Recusar" so desatribuia o documento (voltava pra Disponivel)
-- em vez de marcar como Rejeitado de vez. Esta migration corrige, com base
-- no historico (document_reviews), os documentos que ficaram "perdidos"
-- como Disponivel apos terem sido recusados e nao terem sido reatribuidos
-- desde entao.
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

UPDATE documents d
SET status = 'rejected'
WHERE d.status = 'available'
  AND d.assigned_to IS NULL
  AND EXISTS (
    SELECT 1 FROM document_reviews dr
    WHERE dr.document_id = d.id AND dr.action = 'rejected'
  );
