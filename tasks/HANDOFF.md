# Handoff — Project Atlas

## Status snapshot
Last updated: 2026-07-31

**Step 1 of 10 complete.** Scaffold + provider boundary + schema committed (`4142f8e`).
Nothing runs end-to-end yet — no adapter implementation, no UI, no database instance.
Full plan: `/home/greyw0rks/.claude/plans/nested-bubbling-babbage.md`

## What Atlas is
Paste an EVM address → fan out live to 6 chains → detect bridge hops → force-directed graph.
On-demand only: **no indexer, no backfill.** $0/mo data budget. 6 chains: Ethereum, Base,
Arbitrum, Optimism, Polygon, Celo.

Deliberately NOT in v1: entity clustering, mixer deanonymization, non-EVM chains.

## What's done
- Next.js 14 app router + TS + Tailwind + Prisma 5.22, at `/home/greyw0rks/atlas/` (own git repo)
- `lib/chains.ts` — 6-chain config, extends the `/home/greyw0rks/yieldscout/lib/chains.ts` pattern
- `lib/adapters/types.ts` — `ChainAdapter` interface; the swap point for data providers
- `prisma/schema.prisma` — 9 models, validated, client generated
- `.env.example` committed; `.env` gitignored
- Typecheck clean, `npm run build` green

## Verified facts (curl, 2026-07-31)
- **Blockscout v2 returns HTTP 200 with real data on all 6 chains.** eth 594KB / base 531KB /
  arbitrum 536KB / optimism 696KB / polygon 1.2MB / celo 109KB. Latency 2.6–8.2s.
  The user believed it was unavailable on 2026-07-31; it was not. If it fails later, check for
  429 (recoverable) vs the announced move to a Pro tier (real, future).
- **`?filter=to` and `?type=ERC-20` ARE honored server-side.** Halves the pagination budget.
- **Tx-list items already embed `method`, `decoded_input`, and nested `token_transfers`** —
  bridge candidate prefiltering costs zero extra calls.
- `/addresses/{addr}/logs` returns logs *emitted by* the address → **empty for EOAs**. Use
  `/transactions/{hash}/logs`, which returns a `decoded` block with named params.
- Optimism's blockscout host 301-redirects → `explorer.optimism.io` hardcoded.
- Rate-limit headers exposed: `x-ratelimit-limit: 180` / `-remaining` / `-reset`. Buckets are
  **per-endpoint** (`/stats` was 10), and the limit is **per egress IP**, shared across all users.

## Next step (step 2 of 10)
Blockscout adapter, **Ethereum only**. Prove fetch → normalize → `Transfer` rows.
Verify: a known address's tx count matches the public explorer UI exactly.

Then in order: 3) single-chain address table, 4) 6-chain parallel + streaming NDJSON route,
5) Postgres cache + token bucket (**before** the graph — step 4 will hit limits),
6) bridge registry + deterministic matching (Across + CCTP first), 7) fuzzy fallback,
8) graph + timeline, 9) free label sets, 10) honesty pass.

## Blocked on human
- **Postgres instance.** No DB exists yet. `.env` points at `localhost:5432`; either run the
  docker one-liner in `.env.example` or provision Neon/Supabase. `prisma migrate dev` has NOT run.
- Optional: Alchemy API key (faster path; app works fully without it).
- Eventually: a stated position on who the customer is, before clustering/mixer work.

## What has failed / been ruled out
- **Dune Sim** — shut down 2026-08-01, new signups disabled since May 2025. Was the only API
  doing cross-chain address activity in one call. Cannot be used.
- **Envio HyperSync** — `POST eth.hypersync.xyz/query` → **401**, token mandatory since Nov 2025.
  Could not verify performance. Worse: it's a range **scan**, architecturally wrong for
  per-address point queries. Rejected as primary.
- **Etherscan V2 free tier** — dropped Base/Optimism/BNB/Avalanche (Nov 2025), max records
  10k→1k (Jul 2026), Celo on an exhaustible shared pool. Covers only 4/6 chains. Supplement only;
  full coverage is $49/mo Lite, outside the $0 budget.
- **Canonical L2→L1 bridge matching** — cut from v1. A 7-day window with no join key produces
  constant false positives. A wrong edge is worse than a missing one in a tracing tool.
- `create-next-app --src-dir=false` is not a valid flag and hangs on an interactive prompt.
  Use `--no-src-dir`.
- `npm audit fix` cannot clear the last 2 high vulns (Next's bundled postcss + Image Optimizer
  DoS); both need a Next 15 major bump. Neither applies here — Vercel-hosted, no `remotePatterns`.
  Left as-is deliberately.

## Risks
1. **Shared-IP rate limiting** — 180 req/30s across ALL users; one 6-chain trace burns 30–60.
   ~10 concurrent users saturate it. Needs the Postgres token bucket; free-tier Atlas has a real
   concurrency ceiling and the UI must say so.
2. **Bridge registry rot** — Across alone has 3 `topic0` eras. Key on the decoded event *name*,
   not a precomputed hash; version the registry by block range.
3. **Join keys are opaque strings, never numbers** — Across `depositId` can be a 70-digit hashed
   value.
4. **`/logs` enrichment cost** — cap at 25 candidate txs per trace, ranked by amount desc.
5. **Blockscout deprecation** — per-instance APIs moving toward Pro (free tier 5 rps). The
   `ChainAdapter` interface exists for exactly this; keep an Alchemy adapter as the escape hatch.
6. **Latency** — 5s for a full 6-chain trace is not achievable cold. Reframed: first chain in
   ~3s via streaming, complete in ~30s, instant on cache hit.

## Non-negotiables carried from planning
- **Never present a heuristic match as certain.** Confidence + named evidence on every edge;
  deterministic join-key matches alone reach 1.00, heuristics cap at 0.80.
- **Never silently truncate.** A whale trace that looks complete but isn't is the worst failure
  mode. Banner naming the chain and exact cutoff block/timestamp.
- **Amounts are `Decimal(78,0)` raw base units.** Deliberately diverges from
  `/home/greyw0rks/treasury-agent/backend/prisma/schema.prisma`'s `Decimal(18,6)`, which would
  truncate 18-decimal tokens and invalidate fee-tolerance comparisons.
- Dual-use software. The v1 omission of clustering and mixer analysis is a decision, not a gap.
