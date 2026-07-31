// The six EVM chains Atlas traces across.
//
// `blockscoutHost` is the API host, NOT the branded explorer URL. Optimism's
// blockscout instance 301-redirects to explorer.optimism.io, so the final host
// is hardcoded rather than followed at request time.

export type ChainKey =
  | "ethereum"
  | "base"
  | "arbitrum"
  | "optimism"
  | "polygon"
  | "celo";

export interface ChainConfig {
  key: ChainKey;
  id: number;
  name: string;
  blockscoutHost: string;
  explorer: string;
  nativeSymbol: string;
  /** Alchemy network slug, when the optional Alchemy adapter is configured. */
  alchemyNetwork: string | null;
}

export const CHAINS: Record<ChainKey, ChainConfig> = {
  ethereum: {
    key: "ethereum",
    id: 1,
    name: "Ethereum",
    blockscoutHost: "eth.blockscout.com",
    explorer: "https://etherscan.io",
    nativeSymbol: "ETH",
    alchemyNetwork: "eth-mainnet",
  },
  base: {
    key: "base",
    id: 8453,
    name: "Base",
    blockscoutHost: "base.blockscout.com",
    explorer: "https://basescan.org",
    nativeSymbol: "ETH",
    alchemyNetwork: "base-mainnet",
  },
  arbitrum: {
    key: "arbitrum",
    id: 42161,
    name: "Arbitrum",
    blockscoutHost: "arbitrum.blockscout.com",
    explorer: "https://arbiscan.io",
    nativeSymbol: "ETH",
    alchemyNetwork: "arb-mainnet",
  },
  optimism: {
    key: "optimism",
    id: 10,
    name: "Optimism",
    blockscoutHost: "explorer.optimism.io",
    explorer: "https://optimistic.etherscan.io",
    nativeSymbol: "ETH",
    alchemyNetwork: "opt-mainnet",
  },
  polygon: {
    key: "polygon",
    id: 137,
    name: "Polygon",
    blockscoutHost: "polygon.blockscout.com",
    explorer: "https://polygonscan.com",
    nativeSymbol: "POL",
    alchemyNetwork: "polygon-mainnet",
  },
  celo: {
    key: "celo",
    id: 42220,
    name: "Celo",
    blockscoutHost: "celo.blockscout.com",
    explorer: "https://celoscan.io",
    nativeSymbol: "CELO",
    alchemyNetwork: null,
  },
};

export const TRACED_CHAINS: ChainKey[] = [
  "ethereum",
  "base",
  "arbitrum",
  "optimism",
  "polygon",
  "celo",
];

export const CHAIN_BY_ID: Record<number, ChainConfig> = Object.fromEntries(
  Object.values(CHAINS).map((c) => [c.id, c]),
);

export function isChainKey(value: string): value is ChainKey {
  return value in CHAINS;
}
