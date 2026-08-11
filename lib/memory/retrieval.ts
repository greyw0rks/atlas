/**
 * Memory retrieval functions for Atlas
 * Fetches prior investigations, counterparty labels, route priors, and vector kNN
 */

import { prisma } from '../db';
import type { Investigation, AddressProfile, BridgeRoute } from '@prisma/client';

/**
 * Fetch prior investigations for an address
 * Returns most recent investigations ordered by timestamp desc
 */
export async function getPriorInvestigations(
  address: string,
  limit = 5,
): Promise<Investigation[]> {
  return prisma.investigation.findMany({
    where: {
      rootAddress: address.toLowerCase(),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Fetch AddressProfile for an address (accumulated knowledge)
 * Returns null if never seen before
 */
export async function getAddressProfile(
  address: string,
): Promise<AddressProfile | null> {
  return prisma.addressProfile.findUnique({
    where: {
      address: address.toLowerCase(),
    },
  });
}

/**
 * Fetch profiles for multiple addresses in batch
 */
export async function getAddressProfiles(
  addresses: string[],
): Promise<Map<string, AddressProfile>> {
  const profiles = await prisma.addressProfile.findMany({
    where: {
      address: {
        in: addresses.map(a => a.toLowerCase()),
      },
    },
  });

  return new Map(profiles.map(p => [p.address, p]));
}

/**
 * Fetch BridgeRoute priors for a given protocol + route
 * Returns learned statistics (median fee, p90 latency, observation count)
 */
export async function getRoutePrior(
  protocol: string,
  fromChain: number,
  toChain: number,
  tokenSymbol: string,
): Promise<BridgeRoute | null> {
  return prisma.bridgeRoute.findUnique({
    where: {
      protocol_srcChainId_dstChainId_tokenSymbol: {
        protocol,
        srcChainId: fromChain,
        dstChainId: toChain,
        tokenSymbol,
      },
    },
  });
}

/**
 * Fetch all route priors for a protocol (all chain pairs)
 */
export async function getProtocolRoutes(
  protocol: string,
): Promise<BridgeRoute[]> {
  return prisma.bridgeRoute.findMany({
    where: {
      protocol,
    },
    orderBy: [
      { observationCount: 'desc' },
      { srcChainId: 'asc' },
    ],
  });
}

/**
 * Vector kNN search: find addresses with similar behavior
 * Uses pgvector <-> (cosine distance) operator
 * Only searches addresses with embeddings (observationCount >= 2 OR degree >= 3)
 */
export async function findSimilarAddresses(
  queryEmbedding: number[],
  limit = 10,
  minObservations = 2,
): Promise<Array<AddressProfile & { distance: number }>> {
  // Prisma doesn't support pgvector natively, use raw SQL
  const vectorString = `[${queryEmbedding.join(',')}]`;

  const results = await prisma.$queryRaw<
    Array<AddressProfile & { distance: number }>
  >`
    SELECT
      address,
      "observationCount",
      "chainIds",
      "bridgeProtocols",
      degree,
      "topTokens",
      "behaviorText",
      "behaviorEmbedding",
      "createdAt",
      "updatedAt",
      ("behaviorEmbedding" <-> ${vectorString}::vector) AS distance
    FROM "AddressProfile"
    WHERE "behaviorEmbedding" IS NOT NULL
      AND "observationCount" >= ${minObservations}
    ORDER BY distance ASC
    LIMIT ${limit}
  `;

  return results;
}

/**
 * Get high-degree addresses (hubs in the counterparty graph)
 * Useful for identifying bridge aggregators, MEV bots, exchange deposit addresses
 */
export async function getHighDegreeAddresses(
  minDegree = 10,
  limit = 50,
): Promise<AddressProfile[]> {
  return prisma.addressProfile.findMany({
    where: {
      degree: {
        gte: minDegree,
      },
    },
    orderBy: {
      degree: 'desc',
    },
    take: limit,
  });
}

/**
 * Get addresses that use a specific bridge protocol
 */
export async function getAddressesByProtocol(
  protocol: string,
  limit = 50,
): Promise<AddressProfile[]> {
  return prisma.addressProfile.findMany({
    where: {
      bridgeProtocols: {
        has: protocol,
      },
    },
    orderBy: {
      observationCount: 'desc',
    },
    take: limit,
  });
}

/**
 * Get cross-chain activity summary stats
 * Returns aggregate counts for dashboards
 */
export async function getMemoryStats(): Promise<{
  totalInvestigations: number;
  uniqueAddresses: number;
  learnedRoutes: number;
  topProtocols: Array<{ protocol: string; count: number }>;
}> {
  const [
    totalInvestigations,
    uniqueAddresses,
    learnedRoutes,
    protocolCounts,
  ] = await Promise.all([
    prisma.investigation.count(),
    prisma.addressProfile.count(),
    prisma.bridgeRoute.count(),
    // Top 10 protocols by observation count
    prisma.bridgeRoute.groupBy({
      by: ['protocol'],
      _sum: {
        observationCount: true,
      },
      orderBy: {
        _sum: {
          observationCount: 'desc',
        },
      },
      take: 10,
    }),
  ]);

  return {
    totalInvestigations,
    uniqueAddresses,
    learnedRoutes,
    topProtocols: protocolCounts.map(p => ({
      protocol: p.protocol,
      count: p._sum.observationCount || 0,
    })),
  };
}

/**
 * Retrieve full investigation data for narrative generation
 * Includes transactions, profile, and bridge activity
 */
export async function retrieveInvestigation(address: string) {
  const normalizedAddress = address.toLowerCase();

  const [profile, transactions, bridges] = await Promise.all([
    prisma.addressProfile.findUnique({
      where: { address: normalizedAddress },
    }),
    prisma.transfer.findMany({
      where: {
        OR: [
          { fromAddr: normalizedAddress },
          { toAddr: normalizedAddress },
        ],
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    }),
    prisma.bridgeRoute.findMany({
      orderBy: { observationCount: 'desc' },
      take: 20,
    }),
  ]);

  return {
    address: normalizedAddress,
    profile,
    transactions,
    bridges,
  };
}
