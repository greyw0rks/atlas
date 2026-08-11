"use strict";
/**
 * Memory retrieval functions for Atlas
 * Fetches prior investigations, counterparty labels, route priors, and vector kNN
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPriorInvestigations = getPriorInvestigations;
exports.getAddressProfile = getAddressProfile;
exports.getAddressProfiles = getAddressProfiles;
exports.getRoutePrior = getRoutePrior;
exports.getProtocolRoutes = getProtocolRoutes;
exports.findSimilarAddresses = findSimilarAddresses;
exports.getHighDegreeAddresses = getHighDegreeAddresses;
exports.getAddressesByProtocol = getAddressesByProtocol;
exports.getMemoryStats = getMemoryStats;
exports.retrieveInvestigation = retrieveInvestigation;
const db_1 = require("../db");
/**
 * Fetch prior investigations for an address
 * Returns most recent investigations ordered by timestamp desc
 */
async function getPriorInvestigations(address, limit = 5) {
    return db_1.prisma.investigation.findMany({
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
async function getAddressProfile(address) {
    return db_1.prisma.addressProfile.findUnique({
        where: {
            address: address.toLowerCase(),
        },
    });
}
/**
 * Fetch profiles for multiple addresses in batch
 */
async function getAddressProfiles(addresses) {
    const profiles = await db_1.prisma.addressProfile.findMany({
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
async function getRoutePrior(protocol, fromChain, toChain, tokenSymbol) {
    return db_1.prisma.bridgeRoute.findUnique({
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
async function getProtocolRoutes(protocol) {
    return db_1.prisma.bridgeRoute.findMany({
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
async function findSimilarAddresses(queryEmbedding, limit = 10, minObservations = 2) {
    // Prisma doesn't support pgvector natively, use raw SQL
    const vectorString = `[${queryEmbedding.join(',')}]`;
    const results = await db_1.prisma.$queryRaw `
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
async function getHighDegreeAddresses(minDegree = 10, limit = 50) {
    return db.addressProfile.findMany({
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
async function getAddressesByProtocol(protocol, limit = 50) {
    return db.addressProfile.findMany({
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
async function getMemoryStats() {
    const [totalInvestigations, uniqueAddresses, learnedRoutes, addressesWithEmbeddings, protocolCounts,] = await Promise.all([
        db_1.prisma.investigation.count(),
        db_1.prisma.addressProfile.count(),
        db_1.prisma.bridgeRoute.count(),
        db_1.prisma.addressProfile.count({
            where: {
                behaviorEmbedding: {
                    not: null,
                },
            },
        }),
        // Top 10 protocols by observation count
        db_1.prisma.bridgeRoute.groupBy({
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
        addressesWithEmbeddings,
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
async function retrieveInvestigation(address) {
    const normalizedAddress = address.toLowerCase();
    const [profile, transactions, bridges] = await Promise.all([
        db_1.prisma.addressProfile.findUnique({
            where: { address: normalizedAddress },
        }),
        db_1.prisma.transaction.findMany({
            where: { address: normalizedAddress },
            orderBy: { timestamp: 'desc' },
            take: 100,
        }),
        db_1.prisma.bridgeRoute.findMany({
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
