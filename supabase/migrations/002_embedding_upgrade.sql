-- Migration 002: Upgrade embeddings from 384 to 768 dimensions and integrate Supabase Auth

-- Drop old HNSW indexes tied to 384 dimensions
DROP INDEX IF EXISTS document_chunks_embedding_idx;
DROP INDEX IF EXISTS legal_knowledge_embedding_idx;

-- Drop old RPC functions referencing vector(384)
DROP FUNCTION IF EXISTS vector_search(vector(384), INT, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS vector_search_knowledge(vector(384), INT);

-- Reset existing vector columns data for dimension upgrade
UPDATE document_chunks SET embedding = NULL;
DELETE FROM legal_knowledge;

-- Alter vector dimensions to 768 to support Gemini embeddings
ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(768);
ALTER TABLE legal_knowledge ALTER COLUMN embedding TYPE vector(768);

-- Recreate HNSW cosine similarity indexes for vector(768)
CREATE INDEX document_chunks_embedding_idx ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX legal_knowledge_embedding_idx ON legal_knowledge
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Recreate vector search functions scoped to users and cases
CREATE OR REPLACE FUNCTION vector_search(
    query_embedding vector(768),
    match_count INT,
    p_user_id UUID,
    p_case_id UUID DEFAULT NULL,
    p_doc_id UUID DEFAULT NULL
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    chunk_text TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.document_id,
        dc.chunk_text,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE d.user_id = p_user_id
      AND (p_case_id IS NULL OR d.case_id = p_case_id)
      AND (p_doc_id IS NULL OR d.id = p_doc_id)
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Recreate global legal knowledge vector search function
CREATE OR REPLACE FUNCTION vector_search_knowledge(
    query_embedding vector(768),
    match_count INT
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    source_name TEXT,
    section TEXT,
    similarity FLOAT
) AS $$
    SELECT 
        id,
        content,
        source_name,
        section,
        1 - (embedding <=> query_embedding) AS similarity
    FROM legal_knowledge
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$ LANGUAGE SQL;

-- Create hybrid search function combining vector distance and full-text search
CREATE OR REPLACE FUNCTION hybrid_search_knowledge(
    query_embedding vector(768),
    query_text TEXT,
    match_count INT,
    vector_weight FLOAT DEFAULT 0.7,
    fts_weight FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    source_name TEXT,
    section TEXT,
    combined_score FLOAT
) AS $$
    SELECT
        id,
        content,
        source_name,
        section,
        (vector_weight * (1 - (embedding <=> query_embedding))) +
        (fts_weight * ts_rank(fts, plainto_tsquery('english', query_text))) AS combined_score
    FROM legal_knowledge
    WHERE fts @@ plainto_tsquery('english', query_text)
       OR embedding <=> query_embedding < 0.5
    ORDER BY combined_score DESC
    LIMIT match_count;
$$ LANGUAGE SQL;

-- Drop deprecated Clerk clerk_id column
ALTER TABLE users DROP COLUMN IF EXISTS clerk_id;

-- Add Supabase Auth UUID reference column
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_auth_id UUID UNIQUE;
CREATE INDEX IF NOT EXISTS users_supabase_auth_id_idx ON users(supabase_auth_id);

-- Auto-register user profiles upon Supabase Auth sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (supabase_auth_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (supabase_auth_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger handler to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Seeding log table tracking background tasks progress
CREATE TABLE IF NOT EXISTS seeding_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file TEXT NOT NULL,
  chunk_index INT NOT NULL,
  chunk_hash TEXT,
  status TEXT DEFAULT 'completed',
  tokens_used INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_file, chunk_index)
);

CREATE INDEX IF NOT EXISTS seeding_log_file_idx ON seeding_log(source_file);
CREATE INDEX IF NOT EXISTS seeding_log_status_idx ON seeding_log(status);
