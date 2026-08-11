import { prisma } from "@/lib/db";
import type { RouteUpdate } from "./types";

/**
 * Upsert a BridgeRoute observation to build learned priors.
 * These replace hardcoded epsilons in fuzzy matching.
 */
export async function upsertBridgeRoute(update: RouteUpdate): Promise<void> {
  const existing = await prisma.bridgeRoute.findUnique({
    where: {
      protocol_srcChainId_dstChainId_tokenSymbol: {
        protocol: update.protocol,
        srcChainId: update.srcChainId,
        dstChainId: update.dstChainId,
        tokenSymbol: update.tokenSymbol,
      },
    },
  });

  if (existing) {
    // Incremental median approximation using running average
    const n = existing.observationCount;
    const newMedianFee = existing.medianFeeBps
      .mul(n)
      .plus(update.feeBps)
      .div(n + 1);
    const newMedianLatency = Math.round(
      (existing.medianLatencySec * n + update.latencySec) / (n + 1)
    );
    const newP90 = Math.max(existing.p90LatencySec, update.latencySec);

    await prisma.bridgeRoute.update({
      where: {
        protocol_srcChainId_dstChainId_tokenSymbol: {
          protocol: update.protocol,
          srcChainId: update.srcChainId,
          dstChainId: update.dstChainId,
          tokenSymbol: update.tokenSymbol,
        },
      },
      data: {
        observationCount: { increment: 1 },
        medianFeeBps: newMedianFee,
        medianLatencySec: newMedianLatency,
        p90LatencySec: newP90,
        matchedCount: update.matched ? { increment: 1 } : undefined,
        orphanSendCount: !update.matched ? { increment: 1 } : undefined,
      },
    });
  } else {
    await prisma.bridgeRoute.create({
      data: {
        protocol: update.protocol,
        srcChainId: update.srcChainId,
        dstChainId: update.dstChainId,
        tokenSymbol: update.tokenSymbol,
        medianFeeBps: update.feeBps,
        medianLatencySec: update.latencySec,
        p90LatencySec: update.latencySec,
        matchedCount: update.matched ? 1 : 0,
        orphanSendCount: update.matched ? 0 : 1,
      },
    });
  }
}

/**
 * Get route priors for matching.
 * Returns null if no prior observations exist.
 */
export async function getRoutePrior(
  protocol: string,
  srcChainId: number,
  dstChainId: number,
  tokenSymbol: string
): Promise<{
  medianFeeBps: number;
  medianLatencySec: number;
  p90LatencySec: number;
  observationCount: number;
} | null> {
  const route = await prisma.bridgeRoute.findUnique({
    where: {
      protocol_srcChainId_dstChainId_tokenSymbol: {
        protocol,
        srcChainId,
        dstChainId,
        tokenSymbol,
      },
    },
  });

  if (!route) return null;

  return {
    medianFeeBps: parseFloat(route.medianFeeBps.toString()),
    medianLatencySec: route.medianLatencySec,
    p90LatencySec: route.p90LatencySec,
    observationCount: route.observationCount,
  };
}
