import { NextRequest, NextResponse } from "next/server";
import { retrieveInvestigation } from "@/lib/memory/retrieval";
import {
  buildInvestigationSummary,
  generateNarrative,
} from "@/lib/bedrock/narrative";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing address parameter" }, { status: 400 });
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
  }

  try {
    const investigation = await retrieveInvestigation(address);

    if (!investigation) {
      return NextResponse.json(
        { error: "No investigation found for this address" },
        { status: 404 }
      );
    }

    const summary = buildInvestigationSummary({
      address: investigation.address,
      transactions: investigation.transactions.map((tx: any) => ({
        chainId: tx.chainId,
        timestamp: tx.timestamp,
      })),
      bridgeRoutes: investigation.bridges || [],
    });

    const narrative = await generateNarrative(summary);

    return NextResponse.json({
      address,
      summary,
      narrative,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Narrative generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate narrative",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
