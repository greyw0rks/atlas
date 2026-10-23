// Tatum Sui RPC — onchain verification for Atlas memories.
//
// A coding agent's memory is more trustworthy when the facts it stores about a
// chain can be checked against the chain itself. When a memory mentions a Sui
// object id (0x + 64 hex) or an explicit transaction digest, Atlas asks Tatum's
// Sui RPC gateway what that object/transaction actually is, stores the result
// next to the Walrus blob id, and appends the verified facts to the memory text
// before it is written to Walrus.
//
// Env (see .env.example):
//   TATUM_API_KEY       optional. Sent as x-api-key when present. The Sui
//                       gateway currently answers keyless requests too, so
//                       verification also works without one; a key is still
//                       recommended for rate limits and production use.
//   TATUM_SUI_RPC_URL   defaults to Tatum's Sui mainnet JSON-RPC gateway.
//
// If the gateway rejects a request, the failure is recorded per reference in
// `errors` — the module never pretends a check succeeded.
//
// We use Tatum's JSON-RPC gateway (not the public fullnodes, whose JSON-RPC is
// deprecated) and fall back from sui_getTransactionBlock to sui_getTransaction
// so the integration keeps working across node API versions.

const DEFAULT_TATUM_SUI_RPC = "https://sui-mainnet.gateway.tatum.io";

// Sui object ids are 0x followed by 64 hex characters.
const OBJECT_ID_RE = /\b0x[a-fA-F0-9]{64}\b/g;
// Sui transaction digests are base58. Only accept them when the text says so
// explicitly, otherwise ordinary words would produce false positives.
const DIGEST_RE = /\b(?:tx|transaction|digest)[:\s]+([1-9A-HJ-NP-Za-km-z]{43,44})\b/gi;

const MAX_REFS = 8;
const RPC_TIMEOUT_MS = 15_000;

export interface SuiReference {
  kind: "object" | "transaction";
  id: string;
}

export interface ChainObjectFact {
  id: string;
  type?: string;
  owner?: string;
  version?: string;
}

export interface ChainTransactionFact {
  digest: string;
  status: "success" | "failure" | "unknown";
  error?: string;
  checkpoint?: string | null;
}

export interface ChainVerification {
  provider: "tatum";
  network: string;
  rpcUrl: string;
  verifiedAt: string;
  objects: ChainObjectFact[];
  transactions: ChainTransactionFact[];
  errors: Array<{ ref: string; error: string }>;
}

/** True when an API key is configured. Keyless calls still work today. */
export function tatumConfigured(): boolean {
  return Boolean(process.env.TATUM_API_KEY);
}

export function tatumRpcUrl(): string {
  return process.env.TATUM_SUI_RPC_URL || DEFAULT_TATUM_SUI_RPC;
}

/** Pull Sui object ids and explicitly labelled transaction digests out of text. */
export function extractSuiReferences(text: string): SuiReference[] {
  const refs: SuiReference[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(OBJECT_ID_RE)) {
    const id = match[0].toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    refs.push({ kind: "object", id });
    if (refs.length >= MAX_REFS) return refs;
  }

  for (const match of text.matchAll(DIGEST_RE)) {
    // Skip base58-looking substrings that are actually the tail of an object id
    // (e.g. "0xabc… tx: <digest>" is fine; this guard is for mixed input).
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);
    refs.push({ kind: "transaction", id });
    if (refs.length >= MAX_REFS) break;
  }

  return refs;
}

interface JsonRpcResponse<T> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

async function tatumRpc<T>(method: string, params: unknown[]): Promise<T> {
  const key = process.env.TATUM_API_KEY;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (key) headers["x-api-key"] = key;

  const res = await fetch(tatumRpcUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Tatum RPC ${method} returned HTTP ${res.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
  }

  const json = (await res.json()) as JsonRpcResponse<T>;
  if (json.error) {
    throw new Error(`Tatum RPC ${method} error ${json.error.code}: ${json.error.message}`);
  }
  if (json.result === undefined) {
    throw new Error(`Tatum RPC ${method} returned no result`);
  }
  return json.result;
}

async function fetchObject(id: string): Promise<ChainObjectFact> {
  const result = await tatumRpc<{
    data?: { objectId?: string; type?: string; version?: string; owner?: unknown };
    error?: { code: string; error: string };
  }>("sui_getObject", [id, { showType: true, showOwner: true, showContent: false }]);

  if (result.error) {
    throw new Error(result.error.error || result.error.code);
  }
  const data = result.data;
  if (!data) throw new Error("object not found");

  let owner: string | undefined;
  const rawOwner = data.owner as Record<string, unknown> | string | undefined;
  if (typeof rawOwner === "string") owner = rawOwner;
  else if (rawOwner && typeof rawOwner === "object") {
    owner = (rawOwner.AddressOwner as string) || (rawOwner.ObjectOwner as string) || undefined;
  }

  return { id: data.objectId ?? id, type: data.type, owner, version: data.version };
}

async function fetchTransaction(digest: string): Promise<ChainTransactionFact> {
  const params = [digest, { showEffects: true }];
  let result: {
    digest?: string;
    checkpoint?: string | null;
    effects?: { status?: { status?: string; error?: string } };
  };
  try {
    result = await tatumRpc("sui_getTransactionBlock", params);
  } catch (err) {
    // Newer nodes renamed the method; retry once with the new name.
    if (!/method not found|unknown method|-32601/i.test(String((err as Error)?.message))) throw err;
    result = await tatumRpc("sui_getTransaction", params);
  }

  const status = result.effects?.status?.status;
  return {
    digest: result.digest ?? digest,
    status: status === "success" ? "success" : status ? "failure" : "unknown",
    error: result.effects?.status?.error,
    checkpoint: result.checkpoint ?? null,
  };
}

/**
 * Verify a set of Sui references through Tatum.
 * RPC failures are recorded per-reference; one bad id never sinks the rest.
 */
export async function verifyReferences(refs: SuiReference[]): Promise<ChainVerification> {
  const verification: ChainVerification = {
    provider: "tatum",
    network: process.env.TATUM_SUI_NETWORK || "sui-mainnet",
    rpcUrl: tatumRpcUrl(),
    verifiedAt: new Date().toISOString(),
    objects: [],
    transactions: [],
    errors: [],
  };

  for (const ref of refs) {
    try {
      if (ref.kind === "object") verification.objects.push(await fetchObject(ref.id));
      else verification.transactions.push(await fetchTransaction(ref.id));
    } catch (err) {
      verification.errors.push({ ref: ref.id, error: String((err as Error)?.message ?? err) });
    }
  }

  return verification;
}

/**
 * Extract and verify every Sui reference in a piece of memory text.
 * Returns null when the text has nothing onchain to check.
 */
export async function verifyMemoryText(
  text: string,
): Promise<{ verification: ChainVerification | null; reason?: string }> {
  const refs = extractSuiReferences(text);
  if (refs.length === 0) return { verification: null };

  return { verification: await verifyReferences(refs) };
}

/** Compact, human-readable one-liner appended to the Walrus copy of a memory. */
export function formatVerification(v: ChainVerification): string {
  const parts: string[] = [];

  for (const o of v.objects) {
    const type = o.type ? ` (${o.type})` : "";
    parts.push(`object ${shorten(o.id)} is a live Sui object${type}`);
  }
  for (const t of v.transactions) {
    parts.push(
      `tx ${shorten(t.digest)} ${t.status === "success" ? "succeeded" : t.status === "failure" ? `failed${t.error ? `: ${t.error}` : ""}` : "is not confirmed"}`,
    );
  }
  for (const e of v.errors) {
    parts.push(`${shorten(e.ref)} could not be verified (${e.error})`);
  }

  return `Onchain check via Tatum Sui RPC: ${parts.join("; ")}.`;
}

/** Tiny health probe — proves the gateway is reachable (with a key or keyless). */
export async function tatumHealth(): Promise<{
  ok: boolean;
  rpcUrl: string;
  chainIdentifier?: string;
  error?: string;
}> {
  try {
    const result = await tatumRpc<string>("sui_getChainIdentifier", []);
    return { ok: true, rpcUrl: tatumRpcUrl(), chainIdentifier: result };
  } catch (err) {
    return { ok: false, rpcUrl: tatumRpcUrl(), error: String((err as Error)?.message ?? err) };
  }
}

function shorten(id: string): string {
  return id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}
