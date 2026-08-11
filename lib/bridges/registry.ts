// Bridge protocol registry. Each protocol defines how to extract join keys from
// decoded logs. Deterministic matching happens when both sides of a hop emit a
// join key and they match exactly.

import type { DecodedLog, DecodedParam } from "@/lib/adapters/types";

export interface BridgeProtocol {
  name: string;
  // Contract addresses by chainId. Multiple addresses per chain supported
  // (e.g., Across has separate SpokePool contracts per version).
  contracts: Record<number, string[]>;
  // Event names that signal a bridge send/receive. Can match on partial name
  // (e.g., "Deposited" matches "FundsDeposited" or "V3FundsDeposited").
  sendEvents: string[];
  recvEvents: string[];
  // Extract the join key from a decoded log. Returns null if the log doesn't
  // contain enough info or doesn't match this protocol.
  extractJoinKey: (log: DecodedLog, chainId: number) => string | null;
}

// Find a param by name (case-insensitive) in a decoded log.
function findParam(params: DecodedParam[], name: string): DecodedParam | undefined {
  const lower = name.toLowerCase();
  return params.find((p) => p.name.toLowerCase() === lower);
}

// Across v3 — deterministic via (originChainId, depositId).
// Blockscout decodes both fields on both send (FundsDeposited, V3FundsDeposited)
// and receive (FilledV3Relay) events.
export const ACROSS: BridgeProtocol = {
  name: "Across",
  contracts: {
    // SpokePool addresses by chain — Across has multiple versions per chain.
    // These are the v3 addresses; older versions also exist but share the same
    // join-key extraction logic.
    1: [
      "0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5", // Ethereum SpokePool v3
    ],
    10: [
      "0x6f26Bf09B1C792e3228e5467807a900A503c0281", // Optimism SpokePool v3
    ],
    137: [
      "0x9295ee1d8C5b022Be115A2AD3c30C72E34e7F096", // Polygon SpokePool v3
    ],
    8453: [
      "0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64", // Base SpokePool v3
    ],
    42161: [
      "0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A", // Arbitrum SpokePool v3
    ],
    42220: [
      "0x2d509190Ed0172ba588407D4c2df918F955Cc6E1", // Celo SpokePool v3
    ],
  },
  sendEvents: ["FundsDeposited", "V3FundsDeposited"],
  recvEvents: ["FilledV3Relay", "FilledRelay"],
  extractJoinKey: (log) => {
    // TODO D6: may need chainId for chain-specific parsing
    // Send: look for originChainId + depositId
    if (log.eventName && log.eventName.includes("Deposited")) {
      const originChainId = findParam(log.params, "originChainId")?.value;
      const depositId = findParam(log.params, "depositId")?.value;
      if (originChainId && depositId) {
        return `across:${originChainId}:${depositId}`;
      }
    }
    // Recv: look for originChainId + depositId (same fields on fill events)
    if (log.eventName && log.eventName.includes("Filled")) {
      const originChainId = findParam(log.params, "originChainId")?.value;
      const depositId = findParam(log.params, "depositId")?.value;
      if (originChainId && depositId) {
        return `across:${originChainId}:${depositId}`;
      }
    }
    return null;
  },
};

// CCTP (Circle's Cross-Chain Transfer Protocol) — deterministic via nonce.
// The TokenMessenger contract emits DepositForBurn with a nonce, and the
// MessageTransmitter emits MessageReceived with the same nonce on the dest chain.
export const CCTP: BridgeProtocol = {
  name: "CCTP",
  contracts: {
    // TokenMessenger addresses (send side)
    1: ["0xBd3fa81B58Ba92a82136038B25aDec7066af3155"], // Ethereum
    10: ["0x2B4069517957735bE00ceE0fadAE88a26365528f"], // Optimism
    137: ["0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE"], // Polygon
    8453: ["0x1682Ae6375C4E4A97e4B583BC394c861A46D8962"], // Base
    42161: ["0x19330d10D9Cc8751218eaf51E8885D058642E08A"], // Arbitrum
    // MessageTransmitter addresses (receive side) — same on all chains
    // Note: CCTP uses the same nonce across both contracts, so we can match
    // DepositForBurn (TokenMessenger) <-> MessageReceived (MessageTransmitter)
  },
  sendEvents: ["DepositForBurn"],
  recvEvents: ["MessageReceived"],
  extractJoinKey: (log) => {
    // TODO D6: may need chainId for chain-specific parsing
    // Send: DepositForBurn emits a nonce
    if (log.eventName === "DepositForBurn") {
      const nonce = findParam(log.params, "nonce")?.value;
      if (nonce) {
        return `cctp:${nonce}`;
      }
    }
    // Recv: MessageReceived also has the nonce
    if (log.eventName === "MessageReceived") {
      // CCTP sometimes encodes this in the message bytes, but Blockscout
      // typically decodes it as a top-level param. Check both.
      const nonce = findParam(log.params, "nonce")?.value;
      if (nonce) {
        return `cctp:${nonce}`;
      }
    }
    return null;
  },
};

// Registry of all supported protocols.
export const BRIDGE_PROTOCOLS: BridgeProtocol[] = [ACROSS, CCTP];

// Check if an address is a known bridge contract on the given chain.
export function isBridgeContract(address: string, chainId: number): BridgeProtocol | null {
  const lower = address.toLowerCase();
  for (const proto of BRIDGE_PROTOCOLS) {
    const addrs = proto.contracts[chainId] ?? [];
    if (addrs.some((a) => a.toLowerCase() === lower)) {
      return proto;
    }
  }
  return null;
}

// Check if an event name matches a send or receive event for any protocol.
export function matchesProtocol(
  eventName: string,
  address: string,
  chainId: number,
): { protocol: BridgeProtocol; role: "SEND" | "RECV" } | null {
  const proto = isBridgeContract(address, chainId);
  if (!proto) return null;

  const lower = eventName.toLowerCase();
  for (const send of proto.sendEvents) {
    if (lower.includes(send.toLowerCase())) {
      return { protocol: proto, role: "SEND" };
    }
  }
  for (const recv of proto.recvEvents) {
    if (lower.includes(recv.toLowerCase())) {
      return { protocol: proto, role: "RECV" };
    }
  }
  return null;
}
