import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { EntityLabel } from "./types";

/**
 * Upsert an EntityObservation (address label).
 * Unique on (address, label, source).
 */
export async function upsertEntityObservation(label: EntityLabel): Promise<void> {
  await prisma.entityObservation.upsert({
    where: {
      address_label_source: {
        address: label.address,
        label: label.label,
        source: label.source,
      },
    },
    create: {
      address: label.address,
      label: label.label,
      source: label.source,
      confidence: label.confidence,
      evidence: label.evidence as Prisma.InputJsonValue,
    },
    update: {
      confidence: label.confidence,
      evidence: label.evidence as Prisma.InputJsonValue,
      observedAt: new Date(),
    },
  });
}

/**
 * Get all labels for a batch of addresses.
 */
export async function getLabelsForAddresses(
  addresses: string[]
): Promise<Map<string, Array<{ label: string; source: string; confidence: number }>>> {
  const observations = await prisma.entityObservation.findMany({
    where: { address: { in: addresses } },
    select: {
      address: true,
      label: true,
      source: true,
      confidence: true,
    },
  });

  const map = new Map<string, Array<{ label: string; source: string; confidence: number }>>();

  for (const obs of observations) {
    if (!map.has(obs.address)) {
      map.set(obs.address, []);
    }
    map.get(obs.address)!.push({
      label: obs.label,
      source: obs.source,
      confidence: parseFloat(obs.confidence.toString()),
    });
  }

  return map;
}
