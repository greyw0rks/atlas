import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

export interface InvestigationSummary {
  address: string;
  totalTxCount: number;
  chainCount: number;
  topChains: Array<{ chainId: number; txCount: number }>;
  totalValueUSD: string;
  firstSeen: Date;
  lastSeen: Date;
  bridgeActivity?: {
    routeCount: number;
    protocols: string[];
  };
}

/**
 * Generate human-readable narrative from investigation data using Amazon Bedrock
 */
export async function generateNarrative(
  summary: InvestigationSummary,
): Promise<string> {
  const prompt = `You are analyzing blockchain wallet activity. Given the following investigation data, write a concise 2-3 paragraph narrative summary for a compliance analyst.

Address: ${summary.address}
Total Transactions: ${summary.totalTxCount}
Chains Active: ${summary.chainCount}
Top Chains: ${summary.topChains.map((c) => `Chain ${c.chainId} (${c.txCount} txs)`).join(", ")}
Total Value: $${summary.totalValueUSD}
First Activity: ${summary.firstSeen.toISOString().split("T")[0]}
Last Activity: ${summary.lastSeen.toISOString().split("T")[0]}
${summary.bridgeActivity ? `Bridge Routes: ${summary.bridgeActivity.routeCount} across ${summary.bridgeActivity.protocols.join(", ")}` : ""}

Write a professional summary highlighting patterns, risk indicators, and notable activity.`;

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  try {
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return responseBody.content[0].text;
  } catch (error) {
    console.error("Bedrock invocation failed:", error);
    throw new Error(
      `Failed to generate narrative: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Build investigation summary from raw data for narrative generation
 */
export function buildInvestigationSummary(investigation: {
  address: string;
  transactions: Array<{ chainId: number; timestamp: Date }>;
  bridgeRoutes?: Array<{ protocol: string }>;
}): InvestigationSummary {
  const chainCounts = new Map<number, number>();
  let firstSeen = new Date();
  let lastSeen = new Date(0);

  for (const tx of investigation.transactions) {
    chainCounts.set(tx.chainId, (chainCounts.get(tx.chainId) || 0) + 1);
    if (tx.timestamp < firstSeen) firstSeen = tx.timestamp;
    if (tx.timestamp > lastSeen) lastSeen = tx.timestamp;
  }

  const topChains = Array.from(chainCounts.entries())
    .map(([chainId, txCount]) => ({ chainId, txCount }))
    .sort((a, b) => b.txCount - a.txCount)
    .slice(0, 5);

  const protocols = investigation.bridgeRoutes
    ? Array.from(new Set(investigation.bridgeRoutes.map((r) => r.protocol)))
    : [];

  return {
    address: investigation.address,
    totalTxCount: investigation.transactions.length,
    chainCount: chainCounts.size,
    topChains,
    totalValueUSD: "0", // Would compute from transaction values in production
    firstSeen,
    lastSeen,
    bridgeActivity: investigation.bridgeRoutes
      ? {
          routeCount: investigation.bridgeRoutes.length,
          protocols,
        }
      : undefined,
  };
}
