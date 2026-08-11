// Bridge matching logic. Given a set of BridgeEvents (extracted from Transfer
// logs), find deterministic matches where both send and receive share a join key.

import { prisma } from "@/lib/db";
import type { BridgeEvent, Prisma } from "@prisma/client";

interface MatchCandidate {
  sendEvent: BridgeEvent;
  recvEvent: BridgeEvent;
  joinKey: string;
}

// Find all deterministic bridge matches for a given investigation.
// Returns BridgeHop records ready to be inserted.
// TODO D6: scope by investigationId
export async function matchBridgeEvents(): Promise<Prisma.BridgeHopCreateManyInput[]> {
  // Load all BridgeEvents for this investigation's transfers
  const events = await prisma.bridgeEvent.findMany({
    where: {
      transfer: {
        // Assuming we'll add investigationId to Transfer model later.
        // For now, match within a time window or trace session.
        // Placeholder: match all events for now (will refine in D6 with Investigation link)
      },
    },
    orderBy: { id: "asc" },
  });

  // Group by (protocol, joinKey) to find matching pairs
  const sendsByKey = new Map<string, BridgeEvent[]>();
  const recvsByKey = new Map<string, BridgeEvent[]>();

  for (const evt of events) {
    if (!evt.joinKey) continue;
    const key = `${evt.protocol}:${evt.joinKey}`;

    if (evt.role === "SEND") {
      const sends = sendsByKey.get(key) ?? [];
      sends.push(evt);
      sendsByKey.set(key, sends);
    } else if (evt.role === "RECV") {
      const recvs = recvsByKey.get(key) ?? [];
      recvs.push(evt);
      recvsByKey.set(key, recvs);
    }
  }

  // Find deterministic matches: send + recv with same key
  const matches: MatchCandidate[] = [];
  for (const [key, sends] of sendsByKey.entries()) {
    const recvs = recvsByKey.get(key);
    if (!recvs) continue;

    // For each send, match with all receives (handles 1:N cases like CCTP batch)
    for (const send of sends) {
      for (const recv of recvs) {
        // Don't match an event to itself, and don't match same-chain hops
        if (send.id === recv.id) continue;
        if (send.srcChainId === recv.srcChainId) continue;

        matches.push({
          sendEvent: send,
          recvEvent: recv,
          joinKey: key,
        });
      }
    }
  }

  // Convert to BridgeHop records
  const hops: Prisma.BridgeHopCreateManyInput[] = [];
  for (const match of matches) {
    hops.push({
      srcEventId: match.sendEvent.id,
      dstEventId: match.recvEvent.id,
      confidence: 1.0, // Deterministic match = 100% confidence
      matchType: "DETERMINISTIC",
      evidence: {
        joinKey: match.joinKey,
        protocol: match.sendEvent.protocol,
        srcChain: match.sendEvent.srcChainId,
        dstChain: match.recvEvent.srcChainId, // The chain where the recv happened
        method: "decoded_join_key",
      },
    });
  }

  return hops;
}

// Insert BridgeHops, skipping duplicates (unique constraint on srcEventId + dstEventId)
export async function insertBridgeHops(hops: Prisma.BridgeHopCreateManyInput[]) {
  if (hops.length === 0) return 0;

  // Use createMany with skipDuplicates to handle concurrent traces that might
  // discover the same hop.
  const result = await prisma.bridgeHop.createMany({
    data: hops,
    skipDuplicates: true,
  });

  return result.count;
}
