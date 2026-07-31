// Provider-agnostic boundary. Blockscout is the default, but every provider
// detail stays behind this interface so swapping one out is a single new file.

import type { ChainKey } from "@/lib/chains";

export type Address = `0x${string}`;
export type Hash = `0x${string}`;

export type TransferDirection = "IN" | "OUT" | "SELF";

/** One value movement: a native transfer or an ERC-20 Transfer log. */
export interface RawTransfer {
  chainKey: ChainKey;
  txHash: Hash;
  /** Null for native-value transfers, which have no log. */
  logIndex: number | null;
  blockNumber: number;
  timestamp: Date;
  from: Address;
  to: Address | null;
  /** Null for the chain's native asset. */
  tokenAddress: Address | null;
  tokenSymbol: string | null;
  tokenDecimals: number;
  /** Base units (wei). Decimal string — never a JS number. */
  rawAmount: string;
  /** Decoded function name, when the provider supplies one. */
  method: string | null;
  direction: TransferDirection;
}

/** Opaque provider cursor. Blockscout returns next_page_params verbatim. */
export type Cursor = Record<string, unknown>;

export interface TransferPage {
  transfers: RawTransfer[];
  /** Null when no further pages remain. */
  cursor: Cursor | null;
  /** Upstream calls consumed, for rate-limit accounting. */
  cost: number;
}

export interface DecodedParam {
  name: string;
  type: string;
  indexed: boolean;
  value: string;
}

export interface DecodedLog {
  address: Address;
  logIndex: number;
  /** Decoded event name, e.g. "FundsDeposited". Null when undecodable. */
  eventName: string | null;
  params: DecodedParam[];
  topics: string[];
  data: string;
}

export type TransferEndpoint = "transactions" | "token-transfers";

export interface ChainAdapter {
  readonly chainKey: ChainKey;
  readonly chainId: number;
  /**
   * Whether fetchTxLogs returns decoded event parameters. Adapters without it
   * (e.g. Alchemy asset-transfers) cannot do deterministic bridge matching and
   * fall back to heuristics — the UI must say so.
   */
  readonly supportsDecodedLogs: boolean;

  fetchTransfers(
    address: Address,
    endpoint: TransferEndpoint,
    cursor: Cursor | null,
    signal: AbortSignal,
  ): Promise<TransferPage>;

  fetchTxLogs(txHash: Hash, signal: AbortSignal): Promise<DecodedLog[]>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly chainKey: ChainKey,
    readonly status?: number,
    /** Set when the provider signalled rate limiting; ms until retry. */
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
