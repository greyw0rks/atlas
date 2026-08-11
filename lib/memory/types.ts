import { Prisma } from "@prisma/client";

export interface ProfileUpdate {
  address: string;
  chainIds: number[];
  bridgeProtocols: string[];
  degree: number;
  topTokens: string[];
}

export interface RouteUpdate {
  protocol: string;
  srcChainId: number;
  dstChainId: number;
  tokenSymbol: string;
  feeBps: number;
  latencySec: number;
  matched: boolean;
}

export interface EntityLabel {
  address: string;
  label: string;
  source: "BRIDGE_CONTRACT" | "CEX_HEURISTIC" | "USER" | "LLM";
  confidence: number;
  evidence: Prisma.JsonValue;
}

export interface MemoryHit {
  id: string;
  score: number;
}

export interface RetrievalRecord {
  investigationId: string;
  kind: "prior_investigation" | "counterparty_labels" | "route_prior" | "vector_knn";
  queryText: string;
  hits: MemoryHit[];
  latencyMs: number;
}
