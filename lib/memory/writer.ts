import { prisma } from "@/lib/db";
import type { Transfer } from "@prisma/client";
import type { BridgeHopData } from "@/lib/tracer";
import { embedBehaviorText } from "./embedder";

interface TraceResult {
  transfers: Transfer[];
  bridgeHops: BridgeHopData[];
  chainIds: number[];
  durationMs: number;
  truncated: boolean;
}

/**
 * Memory write path. Called after each trace completes.
 * Upserts Investigation, AddressProfile (root + counterparties), BridgeRoute priors,
 * and triggers embedding for profiles that cross the observation threshold.
 */
export async function writeMemory(
  rootAddress: string,
  result: TraceResult,
): Promise<{ investigationId: string }> {
  const startMs = Date.now();

  // 1. Create Investigation record
  const investigation = await prisma.investigation.create({
    data: {
      rootAddress: rootAddress.toLowerCase(),
      chainIds: result.chainIds,
      transferCount: result.transfers.length,
      hopCount: result.bridgeHops.length,
      truncated: result.truncated,
      durationMs: result.durationMs,
      // narrative filled later by Bedrock (D8)
    },
  });

  // 2. Extract all unique addresses from transfers
  const addresses = new Set<string>();
  addresses.add(rootAddress.toLowerCase());

  for (const transfer of result.transfers) {
    if (transfer.fromAddr) addresses.add(transfer.fromAddr.toLowerCase());
    if (transfer.toAddr) addresses.add(transfer.toAddr.toLowerCase());
  }

  // 3. Upsert AddressProfile for each address
  const profilePromises = Array.from(addresses).map(async (addr) => {
    // Gather stats for this address
    const addrTransfers = result.transfers.filter(
      (t) =>
        t.fromAddr?.toLowerCase() === addr || t.toAddr?.toLowerCase() === addr,
    );

    const chainIds = Array.from(
      new Set(addrTransfers.map((t) => t.chainId)),
    ).sort();

    const tokens = addrTransfers
      .map((t) => t.tokenSymbol)
      .filter((s): s is string => !!s);
    const tokenCounts = new Map<string, number>();
    tokens.forEach((t) => tokenCounts.set(t, (tokenCounts.get(t) || 0) + 1));
    const topTokens = Array.from(tokenCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([token]) => token);

    // Count connections (degree)
    const connections = new Set<string>();
    addrTransfers.forEach((t) => {
      if (t.fromAddr?.toLowerCase() === addr && t.toAddr) {
        connections.add(t.toAddr.toLowerCase());
      }
      if (t.toAddr?.toLowerCase() === addr && t.fromAddr) {
        connections.add(t.fromAddr.toLowerCase());
      }
    });

    // Find which bridge protocols this address used
    const bridgeProtocols = Array.from(
      new Set(
        result.bridgeHops
          .filter(
            (hop) => {
              // bridgeHopsData doesn't have transfer objects, only basic event data
              // We need to match by txHash instead
              const srcMatch = addrTransfers.some(
                (t) =>
                  t.txHash === hop.srcEvent.txHash &&
                  (t.fromAddr?.toLowerCase() === addr ||
                    t.toAddr?.toLowerCase() === addr),
              );
              const dstMatch = addrTransfers.some(
                (t) =>
                  t.txHash === hop.dstEvent.txHash &&
                  (t.fromAddr?.toLowerCase() === addr ||
                    t.toAddr?.toLowerCase() === addr),
              );
              return srcMatch || dstMatch;
            },
          )
          .map((hop) => hop.srcEvent.protocol),
      ),
    );

    // Fetch existing profile to merge arrays
    const existing = await prisma.addressProfile.findUnique({
      where: { address: addr },
    });

    const mergedChainIds = existing
      ? Array.from(new Set([...existing.chainIds, ...chainIds])).sort()
      : chainIds;

    const mergedBridgeProtocols = existing
      ? Array.from(
          new Set([...existing.bridgeProtocols, ...bridgeProtocols]),
        )
      : bridgeProtocols;

    // Upsert profile
    const profile = await prisma.addressProfile.upsert({
      where: { address: addr },
      create: {
        address: addr,
        observationCount: 1,
        chainIds: mergedChainIds,
        bridgeProtocols: mergedBridgeProtocols,
        degree: connections.size,
        topTokens,
        behaviorText: "", // filled below
      },
      update: {
        observationCount: { increment: 1 },
        chainIds: mergedChainIds,
        bridgeProtocols: mergedBridgeProtocols,
        degree: connections.size,
        topTokens,
        lastSeenAt: new Date(),
      },
    });

    // Generate deterministic behaviorText
    const behaviorText = generateBehaviorText({
      address: profile.address,
      chainIds: mergedChainIds,
      bridgeProtocols: mergedBridgeProtocols,
      degree: connections.size,
      topTokens,
      observationCount: profile.observationCount,
    });

    // Update behaviorText (separate call to avoid race in upsert)
    await prisma.addressProfile.update({
      where: { address: addr },
      data: { behaviorText },
    });

    // Embed if observation count >= 2 (avoid embedding one-off counterparties)
    if (profile.observationCount >= 2 || connections.size >= 3) {
      await embedBehaviorText(addr, behaviorText);
    }

    return profile;
  });

  await Promise.all(profilePromises);

  // 4. Upsert BridgeRoute priors from matched hops
  const routePromises = result.bridgeHops.map(async (hop) => {
    // Fetch full transfer data for src and dst
    const srcTransfer = await prisma.transfer.findFirst({
      where: {
        txHash: hop.srcEvent.txHash,
        chainId: hop.srcEvent.chainId,
      },
    });

    const dstTransfer = await prisma.transfer.findFirst({
      where: {
        txHash: hop.dstEvent.txHash,
        chainId: hop.dstEvent.chainId,
      },
    });

    if (!srcTransfer || !dstTransfer) {
      console.warn(
        `[memory] skipping route for hop ${hop.id}: missing transfer data`,
      );
      return;
    }

    const feeBps =
      srcTransfer.rawAmount && dstTransfer.rawAmount
        ? Number(
            ((BigInt(srcTransfer.rawAmount.toString()) - BigInt(dstTransfer.rawAmount.toString())) * BigInt(10000)) /
              BigInt(srcTransfer.rawAmount.toString()),
          )
        : 0;

    const latencySec = Math.max(
      0,
      Math.floor(
        (dstTransfer.timestamp.getTime() - srcTransfer.timestamp.getTime()) /
          1000,
      ),
    );

    const routeKey = {
      protocol: hop.srcEvent.protocol,
      srcChainId: srcTransfer.chainId,
      dstChainId: dstTransfer.chainId,
      tokenSymbol: srcTransfer.tokenSymbol || "NATIVE",
    };

    // Fetch existing route to compute updated medians
    const existing = await prisma.bridgeRoute.findUnique({
      where: {
        protocol_srcChainId_dstChainId_tokenSymbol: routeKey,
      },
    });

    // Simple incremental median approximation: weight new observation 20%
    const newMedianFeeBps = existing
      ? Number(existing.medianFeeBps) * 0.8 + feeBps * 0.2
      : feeBps;

    const newMedianLatencySec = existing
      ? Math.round(existing.medianLatencySec * 0.8 + latencySec * 0.2)
      : latencySec;

    const newP90LatencySec = existing
      ? Math.max(existing.p90LatencySec, latencySec)
      : latencySec;

    await prisma.bridgeRoute.upsert({
      where: {
        protocol_srcChainId_dstChainId_tokenSymbol: routeKey,
      },
      create: {
        ...routeKey,
        observationCount: 1,
        medianFeeBps: newMedianFeeBps,
        medianLatencySec: newMedianLatencySec,
        p90LatencySec: newP90LatencySec,
        matchedCount: 1,
      },
      update: {
        observationCount: { increment: 1 },
        medianFeeBps: newMedianFeeBps,
        medianLatencySec: newMedianLatencySec,
        p90LatencySec: newP90LatencySec,
        matchedCount: { increment: 1 },
        lastSeenAt: new Date(),
      },
    });
  });

  await Promise.all(routePromises);

  const writeMs = Date.now() - startMs;
  console.log(
    `[memory] wrote investigation ${investigation.id} in ${writeMs}ms: ${addresses.size} profiles, ${result.bridgeHops.length} routes`,
  );

  return { investigationId: investigation.id };
}

/**
 * Deterministic template over structured fields.
 * Re-running a trace on the same data yields byte-identical behaviorText.
 */
function generateBehaviorText(
  profile: {
    address: string;
    chainIds: number[];
    bridgeProtocols: string[];
    degree: number;
    topTokens: string[];
    observationCount: number;
  },
): string {
  const parts: string[] = [];

  parts.push(`Address ${profile.address}`);

  if (profile.observationCount > 1) {
    parts.push(`observed ${profile.observationCount} times`);
  }

  if (profile.chainIds.length > 0) {
    parts.push(`active on chains ${profile.chainIds.join(", ")}`);
  }

  if (profile.degree > 0) {
    parts.push(`${profile.degree} connections`);
  }

  if (profile.bridgeProtocols.length > 0) {
    parts.push(`uses bridges: ${profile.bridgeProtocols.join(", ")}`);
  }

  if (profile.topTokens.length > 0) {
    parts.push(`top tokens: ${profile.topTokens.join(", ")}`);
  }

  return parts.join("; ");
}
