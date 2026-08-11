// Trace orchestrator — fans out to 6 chains in parallel, persists transfers
// idempotently, extracts bridge events and matches them, yields per-chain
// progress via async generator.

import { BlockscoutAdapter } from "@/lib/adapters/blockscout";
import type { Address, RawTransfer } from "@/lib/adapters/types";
import { TRACED_CHAINS, type ChainKey } from "@/lib/chains";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { extractBridgeEvents, insertBridgeEvents } from "@/lib/bridges/extractor";
import { matchBridgeEvents, insertBridgeHops } from "@/lib/bridges/matcher";
import { writeMemory as persistMemory } from "@/lib/memory/writer";

export interface ChainProgress {
  chainKey: ChainKey;
  status: "fetching" | "persisting" | "done" | "error";
  transferCount: number;
  pagesFetched: number;
  hasMore: boolean;
  error?: string;
}

export interface BridgeHopData {
  id: string;
  srcEvent: {
    protocol: string;
    chainId: number;
    txHash: string;
    joinKey: string | null;
  };
  dstEvent: {
    protocol: string;
    chainId: number;
    txHash: string;
    joinKey: string | null;
  };
  matchType: string;
  confidence: string;
}

export interface TraceResult {
  jobId: string;
  rootAddress: string;
  totalTransfers: number;
  chainResults: ChainProgress[];
  durationMs: number;
  bridgeHops: BridgeHopData[];
}

const MAX_PAGES_PER_CHAIN = 5; // Truncation limit for the demo
const FETCH_TIMEOUT_MS = 45_000; // Per-chain timeout, not global

/**
 * Orchestrates a full 6-chain trace. Yields per-chain progress events as they
 * arrive, then a final result once all chains complete or error.
 */
export async function* traceAddress(
  address: Address,
): AsyncGenerator<ChainProgress | TraceResult, void, undefined> {
  const startTime = Date.now();
  const jobId = `job_${Date.now()}_${address.slice(2, 8)}`;
  const chainResults: ChainProgress[] = [];

  // Create the job record
  await prisma.traceJob.create({
    data: {
      id: jobId,
      rootAddress: address.toLowerCase(),
      status: "RUNNING",
      chainStatus: {},
    },
  });

  // Fan out to all 6 chains in parallel. Each chain has its own timeout and
  // won't kill the others if it hangs.
  const promises = TRACED_CHAINS.map((chainKey) =>
    traceOneChain(jobId, address, chainKey, (progress) => {
      // Push progress update to the stream
      const existing = chainResults.find((r) => r.chainKey === chainKey);
      if (existing) {
        Object.assign(existing, progress);
      } else {
        chainResults.push(progress);
      }
      return progress;
    }).catch(() => {
      // Swallow errors — they're already reflected in chainResults via onProgress
      return;
    }),
  );

  // Wait for all chains to settle (success or error)
  const results = await Promise.allSettled(promises);

  // Collect final stats
  const totalTransfers = chainResults.reduce((sum, r) => sum + r.transferCount, 0);
  const truncated = chainResults.some((r) => r.hasMore);
  const durationMs = Date.now() - startTime;

  // Extract bridge events from all transfers and match them
  let bridgeHopsData: BridgeHopData[] = [];
  try {
    // Load all transfers for this job
    const transfers = await prisma.transfer.findMany({
      where: {
        // For now, select all transfers touched during this session.
        // In D6 we'll add investigationId to properly scope this.
        timestamp: {
          gte: new Date(startTime),
        },
      },
      take: 2000, // Limit for safety
    });

    // Extract bridge events from transaction logs
    const controller = new AbortController();
    const bridgeEvents = await extractBridgeEvents(transfers, controller.signal);
    if (bridgeEvents.length > 0) {
      await insertBridgeEvents(bridgeEvents);
    }

    // Match send/recv pairs to create bridge hops
    const hops = await matchBridgeEvents();
    if (hops.length > 0) {
      await insertBridgeHops(hops);

      // Load the created hops with their events for the UI
      const createdHops = await prisma.bridgeHop.findMany({
        where: {
          srcEventId: { in: hops.map(h => h.srcEventId) },
        },
        include: {
          srcEvent: {
            include: {
              transfer: true,
            },
          },
          dstEvent: {
            include: {
              transfer: true,
            },
          },
        },
      });

      bridgeHopsData = createdHops.map(hop => ({
        id: hop.id,
        srcEvent: {
          protocol: hop.srcEvent.protocol,
          chainId: hop.srcEvent.srcChainId ?? hop.srcEvent.transfer.chainId,
          txHash: hop.srcEvent.transfer.txHash,
          joinKey: hop.srcEvent.joinKey,
        },
        dstEvent: {
          protocol: hop.dstEvent.protocol,
          chainId: hop.dstEvent.srcChainId ?? hop.dstEvent.transfer.chainId,
          txHash: hop.dstEvent.transfer.txHash,
          joinKey: hop.dstEvent.joinKey,
        },
        matchType: hop.matchType,
        confidence: hop.confidence.toString(),
      }));
    }
  } catch (err) {
    console.warn("Bridge matching failed:", err);
    // Don't fail the entire trace if bridge matching errors
  }

  // Write memory after bridge matching
  try {
    const allTransfers = await prisma.transfer.findMany({
      where: {
        timestamp: {
          gte: new Date(startTime),
        },
      },
      take: 2000,
    });

    const chainIds = Array.from(
      new Set(allTransfers.map((t) => t.chainId)),
    ).sort();

    await persistMemory(address.toLowerCase(), {
      transfers: allTransfers,
      bridgeHops: bridgeHopsData,
      chainIds,
      durationMs,
      truncated,
    });
  } catch (err) {
    console.warn("Memory write failed:", err);
    // Don't fail the entire trace if memory writes error
  }

  // Update job status
  await prisma.traceJob.update({
    where: { id: jobId },
    data: {
      status: results.every((r) => r.status === "fulfilled") ? "DONE" : "ERROR",
      truncated,
    },
  });

  // Yield final result
  yield {
    jobId,
    rootAddress: address.toLowerCase(),
    totalTransfers,
    chainResults,
    durationMs,
    bridgeHops: bridgeHopsData,
  };
}

async function traceOneChain(
  jobId: string,
  address: Address,
  chainKey: ChainKey,
  onProgress: (progress: ChainProgress) => ChainProgress,
): Promise<void> {
  const adapter = new BlockscoutAdapter(chainKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let transferCount = 0;
  let pagesFetched = 0;
  let hasMore = false;

  try {
    onProgress({
      chainKey,
      status: "fetching",
      transferCount: 0,
      pagesFetched: 0,
      hasMore: false,
    });

    // Fetch both endpoints (native + ERC-20) with pagination
    const endpoints: Array<"transactions" | "token-transfers"> = [
      "transactions",
      "token-transfers",
    ];

    for (const endpoint of endpoints) {
      let cursor: Record<string, unknown> | null = null;
      let pagesThisEndpoint = 0;

      while (pagesThisEndpoint < MAX_PAGES_PER_CHAIN) {
        if (controller.signal.aborted) break;

        const page = await adapter.fetchTransfers(
          address,
          endpoint,
          cursor,
          controller.signal,
        );

        if (page.transfers.length > 0) {
          // Persist transfers idempotently
          await persistTransfers(page.transfers);
          transferCount += page.transfers.length;
          pagesFetched++;
          pagesThisEndpoint++;

          onProgress({
            chainKey,
            status: "persisting",
            transferCount,
            pagesFetched,
            hasMore: page.cursor !== null,
          });
        }

        if (!page.cursor) break;
        cursor = page.cursor;
      }

      // Check if we hit the page limit
      if (cursor !== null && pagesThisEndpoint >= MAX_PAGES_PER_CHAIN) {
        hasMore = true;
      }
    }

    clearTimeout(timeout);

    onProgress({
      chainKey,
      status: "done",
      transferCount,
      pagesFetched,
      hasMore,
    });
  } catch (error) {
    clearTimeout(timeout);

    const errorMsg = controller.signal.aborted
      ? "Timeout"
      : (error as Error).message;

    onProgress({
      chainKey,
      status: "error",
      transferCount,
      pagesFetched,
      hasMore,
      error: errorMsg,
    });

    throw error;
  }
}

/**
 * Idempotent transfer persistence. Uses the (chainId, txHash, logIndex) unique
 * constraint — native transfers use logIndex=-1 as the sentinel since Prisma
 * treats NULL as distinct in compound uniques.
 */
async function persistTransfers(transfers: RawTransfer[]): Promise<void> {
  if (transfers.length === 0) return;

  const data: Prisma.TransferCreateManyInput[] = transfers.map((t) => ({
    chainId:
      t.chainKey === "ethereum" ? 1 :
      t.chainKey === "base" ? 8453 :
      t.chainKey === "arbitrum" ? 42161 :
      t.chainKey === "optimism" ? 10 :
      t.chainKey === "polygon" ? 137 : 42220,
    txHash: t.txHash.toLowerCase(),
    logIndex: t.logIndex ?? -1, // Sentinel for native transfers
    blockNumber: t.blockNumber,
    timestamp: t.timestamp,
    fromAddr: t.from.toLowerCase(),
    toAddr: t.to?.toLowerCase() ?? null,
    tokenAddr: t.tokenAddress?.toLowerCase() ?? null,
    tokenSymbol: t.tokenSymbol,
    decimals: t.tokenDecimals,
    rawAmount: t.rawAmount, // String, never a JS number
    method: t.method,
    direction: t.direction,
  }));

  // createMany with skipDuplicates uses the unique constraint to make this
  // idempotent — re-running a trace won't duplicate transfers.
  await prisma.transfer.createMany({
    data,
    skipDuplicates: true,
  });
}

/**
 * Write memory after a trace completes.
 * Aggregates observations into AddressProfile, BridgeRoute, and embeddings.
 */
// Removed old writeMemory stub - now using lib/memory/writer.ts

