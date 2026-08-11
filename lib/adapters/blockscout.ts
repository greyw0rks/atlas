// Blockscout v2 adapter — the default provider. Keyless, verified live on all
// six chains (2026-07-31).
//
// Response-shape notes, confirmed empirically rather than from docs:
//   - token.address is often null while token.address_hash is populated
//   - decimals arrive as STRINGS ("9"), and may be null for odd tokens
//   - token-transfer items key the tx as `transaction_hash`, txs use `hash`
//   - native txs have no log, so logIndex is null (persisted as -1)
//   - ?filter=to and ?type=ERC-20 are honored server-side
//   - `next_page_params` is an opaque object; echo it back verbatim as a query

import {
  type Address,
  type ChainAdapter,
  type Cursor,
  type DecodedLog,
  type DecodedParam,
  type Hash,
  type RawTransfer,
  type TransferEndpoint,
  type TransferPage,
  ProviderError,
} from "@/lib/adapters/types";
import { CHAINS, type ChainKey } from "@/lib/chains";

interface BsAddressRef {
  hash?: string;
  is_contract?: boolean;
  name?: string | null;
}

interface BsToken {
  address?: string | null;
  address_hash?: string | null;
  symbol?: string | null;
  decimals?: string | null;
  type?: string | null;
}

interface BsTransaction {
  hash?: string;
  block_number?: number;
  timestamp?: string;
  value?: string;
  method?: string | null;
  from?: BsAddressRef | null;
  to?: BsAddressRef | null;
}

interface BsTokenTransfer {
  transaction_hash?: string;
  block_number?: number;
  timestamp?: string;
  log_index?: number;
  method?: string | null;
  from?: BsAddressRef | null;
  to?: BsAddressRef | null;
  token?: BsToken | null;
  total?: { value?: string | null; decimals?: string | null } | null;
}

interface BsPage<T> {
  items?: T[] | null;
  next_page_params?: Cursor | null;
}

interface BsDecodedInput {
  method_call?: string | null;
  parameters?: Array<{
    name?: string;
    type?: string;
    indexed?: boolean;
    value?: unknown;
  }> | null;
}

interface BsLog {
  address?: BsAddressRef | string | null;
  index?: number;
  log_index?: number;
  topics?: (string | null)[] | null;
  data?: string | null;
  decoded?: BsDecodedInput | null;
}

const DEFAULT_DECIMALS = 18;

function normalizeAddress(value: string | null | undefined): Address | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return /^0x[0-9a-f]{40}$/.test(trimmed) ? (trimmed as Address) : null;
}

function parseDecimals(value: string | null | undefined): number {
  if (value === null || value === undefined || value === "") {
    return DEFAULT_DECIMALS;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 77
    ? parsed
    : DEFAULT_DECIMALS;
}

/** Base units must survive as an exact integer string — never via Number. */
function parseRawAmount(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return /^\d+$/.test(trimmed) ? trimmed : null;
}

function parseTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function directionFor(
  subject: Address,
  from: Address | null,
  to: Address | null,
): RawTransfer["direction"] {
  const isFrom = from === subject;
  const isTo = to === subject;
  if (isFrom && isTo) return "SELF";
  return isFrom ? "OUT" : "IN";
}

function stringifyParamValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

export class BlockscoutAdapter implements ChainAdapter {
  readonly chainKey: ChainKey;
  readonly chainId: number;
  readonly supportsDecodedLogs = true;

  private readonly host: string;

  constructor(chainKey: ChainKey) {
    const chain = CHAINS[chainKey];
    this.chainKey = chainKey;
    this.chainId = chain.id;
    this.host = chain.blockscoutHost;
  }

  private async get<T>(path: string, params: Record<string, string>, signal: AbortSignal): Promise<T> {
    const url = new URL(`https://${this.host}/api/v2${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        signal,
        headers: { accept: "application/json" },
        cache: "no-store",
      });
    } catch (cause) {
      if (signal.aborted) throw cause;
      throw new ProviderError(
        `blockscout request failed: ${(cause as Error).message}`,
        this.chainKey,
      );
    }

    if (response.status === 429) {
      // Header is milliseconds-until-reset, not a unix timestamp.
      const reset = Number(response.headers.get("x-ratelimit-reset"));
      throw new ProviderError("rate limited", this.chainKey, 429, Number.isFinite(reset) ? reset : undefined);
    }
    if (!response.ok) {
      throw new ProviderError(
        `blockscout returned ${response.status}`,
        this.chainKey,
        response.status,
      );
    }
    return (await response.json()) as T;
  }

  async fetchTransfers(
    address: Address,
    endpoint: TransferEndpoint,
    cursor: Cursor | null,
    signal: AbortSignal,
  ): Promise<TransferPage> {
    const subject = normalizeAddress(address);
    if (!subject) {
      throw new ProviderError(`invalid address: ${address}`, this.chainKey);
    }

    const params: Record<string, string> = {};
    if (endpoint === "token-transfers") params.type = "ERC-20";
    // next_page_params is opaque; flatten it back onto the query string.
    for (const [key, value] of Object.entries(cursor ?? {})) {
      if (value !== null && value !== undefined) params[key] = String(value);
    }

    const page = await this.get<BsPage<BsTransaction | BsTokenTransfer>>(
      `/addresses/${subject}/${endpoint}`,
      params,
      signal,
    );

    const items = page.items ?? [];
    const transfers =
      endpoint === "transactions"
        ? this.normalizeTransactions(items as BsTransaction[], subject)
        : this.normalizeTokenTransfers(items as BsTokenTransfer[], subject);

    return {
      transfers,
      cursor: page.next_page_params ?? null,
      cost: 1,
    };
  }

  /** Native-value transfers only. Token movements come from the other endpoint. */
  private normalizeTransactions(items: BsTransaction[], subject: Address): RawTransfer[] {
    const out: RawTransfer[] = [];
    for (const item of items) {
      const rawAmount = parseRawAmount(item.value);
      // Contract calls with zero native value carry no value movement.
      if (!rawAmount || rawAmount === "0") continue;

      const txHash = item.hash?.toLowerCase();
      const timestamp = parseTimestamp(item.timestamp);
      const from = normalizeAddress(item.from?.hash);
      if (!txHash || !timestamp || !from || item.block_number === undefined) continue;

      const to = normalizeAddress(item.to?.hash);
      if (from !== subject && to !== subject) continue;

      out.push({
        chainKey: this.chainKey,
        txHash: txHash as Hash,
        logIndex: null,
        blockNumber: item.block_number,
        timestamp,
        from,
        to,
        tokenAddress: null,
        tokenSymbol: CHAINS[this.chainKey].nativeSymbol,
        tokenDecimals: DEFAULT_DECIMALS,
        rawAmount,
        method: item.method ?? null,
        direction: directionFor(subject, from, to),
      });
    }
    return out;
  }

  private normalizeTokenTransfers(items: BsTokenTransfer[], subject: Address): RawTransfer[] {
    const out: RawTransfer[] = [];
    for (const item of items) {
      const txHash = item.transaction_hash?.toLowerCase();
      const timestamp = parseTimestamp(item.timestamp);
      const from = normalizeAddress(item.from?.hash);
      const rawAmount = parseRawAmount(item.total?.value);
      if (!txHash || !timestamp || !from || rawAmount === null) continue;
      if (item.block_number === undefined || item.log_index === undefined) continue;

      const to = normalizeAddress(item.to?.hash);
      if (from !== subject && to !== subject) continue;

      out.push({
        chainKey: this.chainKey,
        txHash: txHash as Hash,
        logIndex: item.log_index,
        blockNumber: item.block_number,
        timestamp,
        from,
        to,
        // `address` is frequently null while `address_hash` is populated.
        tokenAddress: normalizeAddress(item.token?.address ?? item.token?.address_hash),
        tokenSymbol: item.token?.symbol ?? null,
        tokenDecimals: parseDecimals(item.total?.decimals ?? item.token?.decimals),
        rawAmount,
        method: item.method ?? null,
        direction: directionFor(subject, from, to),
      });
    }
    return out;
  }

  async fetchTxLogs(txHash: Hash, signal: AbortSignal): Promise<DecodedLog[]> {
    const page = await this.get<BsPage<BsLog>>(
      `/transactions/${txHash.toLowerCase()}/logs`,
      {},
      signal,
    );

    const out: DecodedLog[] = [];
    for (const log of page.items ?? []) {
      const rawAddress =
        typeof log.address === "string" ? log.address : log.address?.hash;
      const address = normalizeAddress(rawAddress);
      if (!address) continue;

      const params: DecodedParam[] = (log.decoded?.parameters ?? []).map((p) => ({
        name: p.name ?? "",
        type: p.type ?? "",
        indexed: p.indexed ?? false,
        value: stringifyParamValue(p.value),
      }));

      out.push({
        address,
        logIndex: log.index ?? log.log_index ?? 0,
        // "FundsDeposited(address indexed ...)" -> "FundsDeposited". Matching on
        // the decoded name rather than a precomputed topic0 survives the ABI
        // revisions that bridges ship (Across alone has three topic0 eras).
        eventName: log.decoded?.method_call?.split("(")[0]?.trim() || null,
        params,
        topics: (log.topics ?? []).filter((t): t is string => typeof t === "string"),
        data: log.data ?? "0x",
      });
    }
    return out;
  }
}

// Singleton adapter instances by chain
const adapters = new Map<number, BlockscoutAdapter>();

// Get or create an adapter for the given chainId
export function getAdapter(chainId: number): ChainAdapter {
  let adapter = adapters.get(chainId);
  if (!adapter) {
    // Map chainId to ChainKey
    const chainKey =
      chainId === 1 ? "ethereum" :
      chainId === 8453 ? "base" :
      chainId === 42161 ? "arbitrum" :
      chainId === 10 ? "optimism" :
      chainId === 137 ? "polygon" :
      chainId === 42220 ? "celo" :
      null;

    if (!chainKey) {
      throw new Error(`Unsupported chainId: ${chainId}`);
    }

    adapter = new BlockscoutAdapter(chainKey);
    adapters.set(chainId, adapter);
  }
  return adapter;
}
