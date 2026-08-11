import { prisma } from "@/lib/db";
import type { ProfileUpdate } from "./types";

/**
 * Upsert an AddressProfile after observing an address in a trace.
 * Aggregates chains, protocols, degree, top tokens.
 */
export async function upsertAddressProfile(update: ProfileUpdate): Promise<void> {
  const existing = await prisma.addressProfile.findUnique({
    where: { address: update.address },
  });

  if (existing) {
    // Merge arrays, keeping unique values
    const mergedChains = Array.from(new Set([...existing.chainIds, ...update.chainIds])).sort();
    const mergedProtocols = Array.from(
      new Set([...existing.bridgeProtocols, ...update.bridgeProtocols])
    ).sort();
    const mergedTokens = Array.from(new Set([...existing.topTokens, ...update.topTokens])).sort();

    await prisma.addressProfile.update({
      where: { address: update.address },
      data: {
        lastSeenAt: new Date(),
        observationCount: { increment: 1 },
        chainIds: mergedChains,
        bridgeProtocols: mergedProtocols,
        degree: Math.max(existing.degree, update.degree),
        topTokens: mergedTokens.slice(0, 10), // keep top 10
        behaviorText: generateBehaviorText({
          address: update.address,
          chainIds: mergedChains,
          bridgeProtocols: mergedProtocols,
          degree: Math.max(existing.degree, update.degree),
          topTokens: mergedTokens.slice(0, 10),
        }),
      },
    });
  } else {
    await prisma.addressProfile.create({
      data: {
        address: update.address,
        chainIds: update.chainIds,
        bridgeProtocols: update.bridgeProtocols,
        degree: update.degree,
        topTokens: update.topTokens.slice(0, 10),
        behaviorText: generateBehaviorText(update),
      },
    });
  }
}

/**
 * Generate deterministic behaviorText from structured fields.
 * This must be byte-identical across runs so vectors are stable.
 */
function generateBehaviorText(profile: ProfileUpdate): string {
  const chainNames: Record<number, string> = {
    1: "Ethereum",
    8453: "Base",
    42161: "Arbitrum",
    10: "Optimism",
    137: "Polygon",
    42220: "Celo",
  };

  const chains = profile.chainIds.map((id) => chainNames[id] || `Chain-${id}`).join(", ");
  const protocols = profile.bridgeProtocols.length > 0 ? profile.bridgeProtocols.join(", ") : "none";
  const tokens = profile.topTokens.length > 0 ? profile.topTokens.join(", ") : "various";

  return `Address active on ${chains}. Used bridges: ${protocols}. Degree: ${profile.degree}. Top tokens: ${tokens}.`;
}

/**
 * Check if an address should be embedded.
 * Gate: observationCount >= 2 OR degree >= 3
 */
export async function shouldEmbed(address: string): Promise<boolean> {
  const profile = await prisma.addressProfile.findUnique({
    where: { address },
    select: { observationCount: true, degree: true },
  });

  if (!profile) return false;
  return profile.observationCount >= 2 || profile.degree >= 3;
}
