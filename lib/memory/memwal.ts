// Walrus Memory (MemWal) wrapper — the Mainnet system-of-record for Atlas memories.
//
// The hosted relayer does embedding + SEAL encryption + Walrus upload + semantic
// recall server-side; this SDK only signs requests with the Ed25519 delegate key
// and sends text. We keep a thin local SQLite index (Prisma) for the dashboard,
// and store the returned Walrus `blob_id` on each row as onchain proof.
//
// Env (see .env.example):
//   MEMWAL_PRIVATE_KEY  delegate private key (hex) — SECRET
//   MEMWAL_ACCOUNT_ID   the on-chain MemWalAccount OBJECT id (0x + 64 hex). This is
//                       NOT the delegate public key: passing the pubkey makes the
//                       relayer answer HTTP 401. The object id appears as
//                       `account_id` on the account::DelegateKeyAdded event.
//   MEMWAL_SERVER_URL   relayer URL (defaults to the mainnet relayer)

import { MemWal } from "@mysten-incubation/memwal";

export interface WalrusWriteResult {
  id: string;
  blobId: string;
  owner: string;
  namespace: string;
}

export interface WalrusRecallHit {
  blobId: string;
  text: string;
  distance: number; // cosine distance, lower = closer
  createdAt?: string; // RFC3339 write-time
}

const DEFAULT_RELAYER = "https://relayer.memory.walrus.xyz";

let client: MemWal | null | undefined; // undefined = not tried yet, null = unavailable
let warnedMissing = false;
let warnedAuth = false;

/**
 * Lazily create (and cache) the real MemWal client. Returns null when creds are
 * absent so the local SQLite index keeps working offline without crashing dev/build.
 */
export function getMemWal(): MemWal | null {
  if (client !== undefined) return client;

  const key = process.env.MEMWAL_PRIVATE_KEY;
  const accountId = process.env.MEMWAL_ACCOUNT_ID;

  if (!key || !accountId) {
    if (!warnedMissing) {
      console.warn(
        "[memwal] MEMWAL_PRIVATE_KEY / MEMWAL_ACCOUNT_ID not set — Walrus Memory " +
          "writes/recall are disabled. Memories stay in the local SQLite index only.",
      );
      warnedMissing = true;
    }
    client = null;
    return client;
  }

  try {
    client = MemWal.create({
      key,
      accountId,
      serverUrl: process.env.MEMWAL_SERVER_URL || DEFAULT_RELAYER,
    });
  } catch (err) {
    console.error("[memwal] failed to create client:", err);
    client = null;
  }
  return client;
}

/** True when Walrus Memory is wired up (creds present and client constructed). */
export function isWalrusEnabled(): boolean {
  return getMemWal() !== null;
}

function explainAuthHint(err: unknown): void {
  if (warnedAuth) return;
  const msg = String((err as Error)?.message ?? err);
  if (/auth|401|403|account|delegate|unauthor/i.test(msg)) {
    console.error(
      "[memwal] auth/account error. MEMWAL_ACCOUNT_ID is likely wrong: the SDK " +
        "expects the Sui account OBJECT id, not the delegate public key. Copy the " +
        "0x… account id from https://memory.walrus.xyz/dashboard into .env.",
    );
    warnedAuth = true;
  }
}

/**
 * Write a memory to Walrus Memory on Mainnet and wait for the blob to land.
 * Returns null (and logs) if Walrus is disabled or the write fails — callers
 * should still persist to the local SQLite index regardless.
 */
export async function rememberToWalrus(
  text: string,
  namespace: string,
): Promise<WalrusWriteResult | null> {
  const mw = getMemWal();
  if (!mw) return null;
  try {
    const res = await mw.rememberAndWait(text, namespace);
    return {
      id: res.id,
      blobId: res.blob_id,
      owner: res.owner,
      namespace: res.namespace,
    };
  } catch (err) {
    explainAuthHint(err);
    console.error(`[memwal] rememberAndWait failed (ns=${namespace}):`, err);
    return null;
  }
}

/**
 * Semantic recall from Walrus Memory. Returns [] when disabled or on error.
 */
export async function recallFromWalrus(opts: {
  query: string;
  namespace?: string;
  limit?: number;
  maxDistance?: number;
  sort?: "relevance" | "recent";
}): Promise<WalrusRecallHit[]> {
  const mw = getMemWal();
  if (!mw) return [];
  try {
    const res = await mw.recall({
      query: opts.query,
      namespace: opts.namespace,
      limit: opts.limit ?? 10,
      maxDistance: opts.maxDistance,
      sort: opts.sort,
    });
    return (res.results ?? []).map((r) => ({
      blobId: r.blob_id,
      text: r.text,
      distance: r.distance,
      createdAt: r.created_at,
    }));
  } catch (err) {
    explainAuthHint(err);
    console.error(`[memwal] recall failed (ns=${opts.namespace}):`, err);
    return [];
  }
}

/**
 * Semantic recall across every namespace the account holds. The relayer scopes
 * recall to a namespace, so a search with no repository has to discover the
 * namespaces first and merge the per-namespace results by blob id.
 *
 * The namespace walk is capped so one very large account cannot turn a single
 * search into hundreds of relayer calls.
 */
export async function recallAcrossNamespaces(opts: {
  query: string;
  limit?: number;
  maxDistance?: number;
  sort?: "relevance" | "recent";
}): Promise<WalrusRecallHit[]> {
  const mw = getMemWal();
  if (!mw) return [];

  const MAX_NAMESPACES = 25;
  const namespaces: string[] = [];
  try {
    let cursor: string | undefined;
    // 5 pages of 100 is already far past any single user's namespace count;
    // the loop is bounded regardless of what has_more reports.
    for (let page = 0; page < 5 && namespaces.length < MAX_NAMESPACES; page++) {
      const res = await mw.listNamespaces({ cursor, limit: 100 });
      for (const ns of res.namespaces) {
        if (ns.memory_count > 0) namespaces.push(ns.name);
        if (namespaces.length >= MAX_NAMESPACES) break;
      }
      if (!res.has_more || !res.next_cursor) break;
      cursor = res.next_cursor;
    }
  } catch (err) {
    explainAuthHint(err);
    console.error("[memwal] listNamespaces failed during cross-namespace recall:", err);
    return [];
  }

  if (namespaces.length === 0) return [];

  const requested = opts.limit ?? 10;
  const batches = await Promise.all(
    namespaces.map((namespace) =>
      recallFromWalrus({
        query: opts.query,
        namespace,
        limit: requested,
        maxDistance: opts.maxDistance,
        sort: opts.sort,
      }),
    ),
  );

  // Same blob can surface in more than one namespace; keep the closest hit.
  const best = new Map<string, WalrusRecallHit>();
  for (const hits of batches) {
    for (const hit of hits) {
      const prev = best.get(hit.blobId);
      if (!prev || hit.distance < prev.distance) best.set(hit.blobId, hit);
    }
  }

  return [...best.values()].sort((a, b) => a.distance - b.distance).slice(0, requested);
}

/** Relayer health (no signing). Useful for the dashboard + proof tooling. */export async function walrusHealth() {
  const mw = getMemWal();
  if (!mw) return null;
  try {
    return await mw.health();
  } catch (err) {
    console.error("[memwal] health failed:", err);
    return null;
  }
}

/** List namespaces + per-namespace memory counts (proof that memories are on Mainnet). */
export async function walrusNamespaces() {
  const mw = getMemWal();
  if (!mw) return null;
  try {
    return await mw.listNamespaces();
  } catch (err) {
    explainAuthHint(err);
    console.error("[memwal] listNamespaces failed:", err);
    return null;
  }
}
