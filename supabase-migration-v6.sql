-- ============================================
-- RIKO - Migration V6: Historico de revisao (aceitos/recusados por usuario)
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS document_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id),
  viewer_id UUID REFERENCES viewer_users(id),
  cpf TEXT,
  action TEXT NOT NULL CHECK (action IN ('accepted', 'rejected')),
  person_id UUID REFERENCES people(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_reviews_document_id ON document_reviews(document_id);
CREATE INDEX IF NOT EXISTS idx_document_reviews_viewer_id ON document_reviews(viewer_id);

ALTER TABLE document_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on document_reviews" ON document_reviews FOR ALL USING (true) WITH CHECK (true);
