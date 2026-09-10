-- Vector indexes for Atlas 2.0 memory search.
--
-- WHY THIS IS HAND-WRITTEN
-- Prisma cannot emit an index on an Unsupported("VECTOR(1024)") column, so
-- `prisma db push` / `prisma migrate` will never create these. Without them,
-- every atlas_search_memory call is a full table scan that computes cosine
-- distance for every embedded row.
--
-- COCKROACHDB SPECIFICS
-- CockroachDB implements vector search with C-SPANN, not pgvector's HNSW, so
-- `USING hnsw (...)` fails here. The syntax is `CREATE VECTOR INDEX`, and the
-- `vector_cosine_ops` opclass is REQUIRED — the planner will not use the index
-- for the `<=>` operator without it. This matches the working precedent in
-- prisma/migrations/20260807214220_init_cockroach/migration.sql, which built the
-- same index for the (now removed) AddressProfile.behaviorEmbedding column.
--
-- HOW TO APPLY
--   psql "$DATABASE_URL" -f prisma/manual/vector-indexes.sql
--
-- These statements are not idempotent. If an index already exists, CockroachDB
-- errors with "duplicate index name" — that is safe to ignore. Check first with:
--   SELECT indexname FROM pg_indexes
--    WHERE tablename IN ('Memory', 'RepositoryContext');

-- Ranks embedded memories by cosine distance. Used by searchMemories().
CREATE VECTOR INDEX "Memory_embedding_cos"
  ON "Memory" ("embedding" vector_cosine_ops);

-- Ranks repository context vectors. Used by findSimilarRepositories().
CREATE VECTOR INDEX "RepositoryContext_contextEmbedding_cos"
  ON "RepositoryContext" ("contextEmbedding" vector_cosine_ops);
