# D1 Gate Verification — CockroachDB Port Findings

**Date:** 2026-08-10  
**Duration:** ~2 hours (including WSL clock-drift debugging)  
**Status:** ✅ ALL GATES PASSED

## Executive Summary

Successfully ported Atlas from Neon Postgres to CockroachDB Cloud. All three gate requirements verified:
1. Decimal(78,0) holds full uint256 values exactly
2. VECTOR(1024) + cosine index works with pgvector operators
3. Foreign key constraints applied successfully

The port required two non-obvious fixes that are load-bearing for anyone else attempting Prisma + CockroachDB + pgvector.

## Gate Results

### Gate 1: Decimal(78,0) for uint256 amounts ✅

**Test:** Insert max uint256 value (2^256-1 = 115792089237316195423570985008687907853269984665640564039457584007913129639935), read back as text, compare byte-for-byte.

**Result:** PASS — round-trips exactly. No truncation, no scientific notation.

**Implication:** `rawAmount` can be stored as `Decimal(78,0)` and passed as a string across the Prisma boundary without precision loss. This is the core blocker for any chain tracer handling wei/gwei amounts.

### Gate 2: Vector index with cosine ops ✅

**Test:** 
1. Create AddressProfile with `behaviorEmbedding Unsupported("VECTOR(1024)")`
2. Insert via two-phase write: `prisma.addressProfile.upsert({...})` omitting embedding, then `$executeRaw` UPDATE with `::vector` cast
3. Query with `ORDER BY "behaviorEmbedding" <=> $1::vector LIMIT 5`
4. Verify EXPLAIN shows index scan, not full table scan
5. Verify self-distance = 0.0

**Result:** PASS on all five checks.

**Critical findings:**
- The index MUST declare `vector_cosine_ops` explicitly: `CREATE VECTOR INDEX ... ("behaviorEmbedding" vector_cosine_ops)`. Without it, `<=>` queries succeed but do a full table scan.
- `feature.vector_index.enabled` defaults FALSE even on v25.3.7. Must `SET CLUSTER SETTING feature.vector_index.enabled = true;` before creating the index.
- Prisma's typed client cannot write to tables with a vector column — `.create()` throws. The two-phase pattern is mandatory.

### Gate 3: Foreign key constraints ✅

**Test:** Query `information_schema.table_constraints` for FOREIGN KEY constraints in public schema.

**Result:** PASS — 6/6 present:
- `EntityObservation_address_fkey` → AddressProfile(address)
- `MemoryRetrieval_investigationId_fkey` → Investigation(id)
- `BridgeHop_srcEventId_fkey` → BridgeEvent(id)
- `BridgeHop_dstEventId_fkey` → BridgeEvent(id)
- `BridgeEvent_transferId_fkey` → Transfer(id)
- `ChainCursor_jobId_fkey` → TraceJob(id)

## Non-Obvious Blockers Encountered

### 1. WSL clock drift breaks CockroachDB DDL (local Docker only)

**Symptom:** `remote wall time is too far ahead (3.9s) to be trustworthy` during ALTER TABLE.

**Cause:** WSL2 container clock drifts +1–4s ahead of the WSL host. CockroachDB's default `--max-offset=500ms` rejects the connection.

**Fix (local only):** `docker run ... cockroach start-single-node --max-offset=3s`. Not needed on Cloud.

**Impact:** Wasted 45 minutes before realizing the schema was fine and the env was broken.

### 2. Vector index opclass is mandatory but undocumented

**Symptom:** `<=>` queries succeed but EXPLAIN shows `FULL SCAN OF TABLE AddressProfile`. 5ms for 3 rows; would be 5s for 10k.

**Cause:** Prisma emits `CREATE VECTOR INDEX idx ON tbl (col)` with no opclass. CockroachDB creates the index but doesn't bind it to the cosine operator.

**Fix:** Hand-edit migration: `CREATE VECTOR INDEX idx ON tbl (col vector_cosine_ops);`

**Why this matters:** A vector search that silently falls back to a full scan looks like it works in dev (10 rows) and dies in prod (10k rows). The failure mode is invisible until you check EXPLAIN.

### 3. AddressProfile.lastSeenAt needs explicit value

**Symptom:** 23502 (NOT NULL violation) on insert despite `@updatedAt` directive.

**Cause:** `@updatedAt` applies on UPDATE, not INSERT. No `@default(now())` so Prisma omits it.

**Fix:** Explicitly pass `lastSeenAt: new Date()` in `.upsert()` calls.

## Migration Strategy That Worked

1. Local Docker spike to prove syntax (Decimal, VECTOR column, cosine SQL)
2. Generate migration with `--create-only`, hand-edit vector index, apply to Cloud cluster
3. Test with throw-away data (0xGATE2TEST address)
4. Mark migration as applied once verified

**What didn't work:**
- Applying the migration on local Docker (clock drift killed it mid-ALTER)
- Trusting Prisma's auto-generated vector index (it omits the opclass)
- Assuming `@updatedAt` handles INSERT (it doesn't)

## Verification Script

The final gate test is in `/home/greyw0rks/atlas/final_gate_test.js`:
- Gate 1: Decimal round-trip
- Gate 2: Vector index + cosine query + self-distance
- Gate 3: FK count

Run with `node final_gate_test.js`. Takes ~2s. Output must show `✅ ALL GATES PASSED`.

## Recommendations for Future Ports

1. **Always check EXPLAIN on vector queries** — a missing opclass is silent until prod scale.
2. **Set feature.vector_index.enabled first** — it's off by default, no warning.
3. **Two-phase write for vectors** — never pass embedding to typed Prisma client.
4. **Hand-edit vector migrations** — Prisma's codegen doesn't know about opclass.
5. **Test on Cloud early** — local Docker with WSL has false-negative failures.

## Time Breakdown

- Schema design + migration generation: 30 min
- Local Docker debugging (clock drift): 45 min
- Cloud cluster migration + gate tests: 15 min
- Documentation: 15 min

**Total:** ~2 hours, 90 minutes of which were WSL-specific and won't recur.

## Files Modified

- `prisma/schema.prisma` — provider swap, 5 new models
- `prisma/migrations/20260807214220_init_cockroach/migration.sql` — hand-edited vector index
- `.env` — Cloud connection string
- `.env.neon.bak` — original Postgres config

## Next: D2

With the schema proven live, D2 can build the persistence layer with confidence that amounts won't truncate and vector writes won't break the client.
