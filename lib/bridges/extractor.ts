// Bridge event extraction. Given a set of Transfer records, fetch their
// transaction logs and extract BridgeEvents for any transfers that touched
// bridge contracts.

import { prisma } from "@/lib/db";
import { getAdapter } from "@/lib/adapters/blockscout";
import { matchesProtocol } from "@/lib/bridges/registry";
import type { Transfer, Prisma } from "@prisma/client";
import type { Hash } from "@/lib/adapters/types";

interface ExtractedEvent {
  transferId: string;
  protocol: string;
  role: "SEND" | "RECV";
  joinKey: string | null;
  srcChainId: number | null;
  dstChainId: number | null;
  recipient: string | null;
  rawParams: Record<string, unknown>;
}

// Scan a batch of transfers for bridge events. Returns BridgeEvent records
// ready to be inserted.
export async function extractBridgeEvents(
  transfers: Transfer[],
  signal: AbortSignal,
): Promise<Prisma.BridgeEventCreateManyInput[]> {
  const events: ExtractedEvent[] = [];

  // Group transfers by chain to batch requests
  const byChain = new Map<number, Transfer[]>();
  for (const t of transfers) {
    const batch = byChain.get(t.chainId) ?? [];
    batch.push(t);
    byChain.set(t.chainId, batch);
  }

  // Fetch logs for each chain's transfers in parallel
  const promises: Promise<void>[] = [];
  for (const [chainId, batch] of byChain.entries()) {
    promises.push(
      (async () => {
        const adapter = getAdapter(chainId);

        // Fetch logs for each transfer's tx
        for (const transfer of batch) {
          if (signal.aborted) break;

          try {
            const logs = await adapter.fetchTxLogs(transfer.txHash as Hash, signal);

            // Check each log for bridge events
            for (const log of logs) {
              if (!log.eventName) continue;

              const match = matchesProtocol(log.eventName, log.address, chainId);
              if (!match) continue;

              // Extract join key using the protocol's extractor
              const joinKey = match.protocol.extractJoinKey(log, chainId);

              // Build the raw params object for evidence
              const rawParams: Record<string, unknown> = {};
              for (const p of log.params) {
                rawParams[p.name] = p.value;
              }

              // Try to extract destination chain and recipient from params
              // (varies by protocol, so we do a best-effort extraction)
              let dstChainId: number | null = null;
              let recipient: string | null = null;

              for (const p of log.params) {
                if (p.name.toLowerCase().includes("destinationchain")) {
                  const val = parseInt(String(p.value), 10);
                  if (!isNaN(val)) dstChainId = val;
                }
                if (p.name.toLowerCase().includes("recipient") || p.name.toLowerCase() === "to") {
                  recipient = String(p.value);
                }
              }

              events.push({
                transferId: transfer.id,
                protocol: match.protocol.name,
                role: match.role,
                joinKey,
                srcChainId: chainId,
                dstChainId,
                recipient,
                rawParams,
              });
            }
          } catch (err) {
            // Log fetch failed for this tx — continue with others
            console.warn(`Failed to fetch logs for ${transfer.txHash}:`, err);
          }
        }
      })(),
    );
  }

  await Promise.all(promises);

  // Convert to Prisma records
  return events.map((e) => ({
    transferId: e.transferId,
    protocol: e.protocol,
    role: e.role,
    joinKey: e.joinKey,
    srcChainId: e.srcChainId,
    dstChainId: e.dstChainId,
    recipient: e.recipient,
    rawParams: e.rawParams as Prisma.InputJsonValue,
  }));
}

// Insert BridgeEvents, skipping duplicates
export async function insertBridgeEvents(events: Prisma.BridgeEventCreateManyInput[]) {
  if (events.length === 0) return 0;

  // Note: BridgeEvent has no unique constraint besides id, so we can't use
  // skipDuplicates. We'll dedupe client-side before inserting.
  // For now, just insert all (D6 will add proper deduplication).
  const result = await prisma.bridgeEvent.createMany({
    data: events,
  });

  return result.count;
}
