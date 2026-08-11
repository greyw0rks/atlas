#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { prisma } from "./db.js";
const server = new Server({
    name: "atlas-memory",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "store_investigation",
                description: "Store investigation data in Atlas memory. Writes address profile, transactions, and behavior embedding to CockroachDB. Returns confirmation of what was stored.",
                inputSchema: {
                    type: "object",
                    properties: {
                        address: {
                            type: "string",
                            description: "EVM wallet address (0x...)",
                        },
                        transactions: {
                            type: "array",
                            description: "Array of transaction objects with hash, chainId, from, to, value, tokenSymbol, timestamp",
                            items: { type: "object" },
                        },
                        embedding: {
                            type: "array",
                            description: "384-dimensional behavior embedding vector",
                            items: { type: "number" },
                        },
                    },
                    required: ["address", "transactions"],
                },
            },
            {
                name: "retrieve_investigation",
                description: "Retrieve full investigation data for an address from Atlas memory. Returns profile, recent transactions, and embedding status.",
                inputSchema: {
                    type: "object",
                    properties: {
                        address: {
                            type: "string",
                            description: "Wallet address to retrieve (0x...)",
                        },
                    },
                    required: ["address"],
                },
            },
            {
                name: "search_similar",
                description: "Find behaviorally similar addresses using vector kNN search. Returns addresses ranked by cosine similarity to the query address.",
                inputSchema: {
                    type: "object",
                    properties: {
                        address: {
                            type: "string",
                            description: "Query address (0x...)",
                        },
                        limit: {
                            type: "number",
                            description: "Max results to return (default: 10)",
                        },
                    },
                    required: ["address"],
                },
            },
            {
                name: "query_bridges",
                description: "Query learned bridge route patterns from memory. Returns known routes with usage frequency and metadata. All parameters are optional filters.",
                inputSchema: {
                    type: "object",
                    properties: {
                        protocol: {
                            type: "string",
                            description: "Bridge protocol (e.g., 'celer', 'multichain')",
                        },
                        fromChain: {
                            type: "number",
                            description: "Source chain ID",
                        },
                        toChain: {
                            type: "number",
                            description: "Destination chain ID",
                        },
                        tokenSymbol: {
                            type: "string",
                            description: "Token symbol (e.g., 'USDC')",
                        },
                    },
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "store_investigation": {
                const { address, transactions, embedding } = args;
                if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
                    throw new Error("Invalid Ethereum address format");
                }
                // Store or update address profile
                const profile = await prisma.addressProfile.upsert({
                    where: { address },
                    create: {
                        address,
                        investigatedAt: new Date(),
                    },
                    update: {
                        investigatedAt: new Date(),
                    },
                });
                // Store behavior embedding if provided
                if (embedding && embedding.length > 0) {
                    const embeddingStr = `[${embedding.join(',')}]`;
                    await prisma.$executeRaw `
            INSERT INTO "BehaviorEmbedding" (address, embedding, "updatedAt")
            VALUES (${address}, ${embeddingStr}::vector, NOW())
            ON CONFLICT (address)
            DO UPDATE SET embedding = ${embeddingStr}::vector, "updatedAt" = NOW()
          `;
                }
                // Store transactions
                let storedCount = 0;
                for (const tx of transactions) {
                    try {
                        await prisma.transfer.create({
                            data: {
                                hash: tx.hash,
                                address,
                                chainId: tx.chainId,
                                from: tx.from,
                                to: tx.to,
                                value: tx.value,
                                tokenSymbol: tx.tokenSymbol || null,
                                timestamp: new Date(tx.timestamp),
                            },
                        });
                        storedCount++;
                    }
                    catch (e) {
                        // Skip duplicates
                    }
                }
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                address,
                                transactionsStored: storedCount,
                                embeddingStored: embedding && embedding.length > 0,
                            }, null, 2),
                        },
                    ],
                };
            }
            case "retrieve_investigation": {
                const { address } = args;
                if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
                    throw new Error("Invalid Ethereum address format");
                }
                const profile = await prisma.addressProfile.findUnique({
                    where: { address },
                });
                if (!profile) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({ found: false, address }, null, 2),
                            },
                        ],
                    };
                }
                const transactions = await prisma.transfer.findMany({
                    where: { address },
                    orderBy: { timestamp: 'desc' },
                    take: 100,
                });
                const embeddingResult = await prisma.$queryRaw `
          SELECT embedding::text as embedding
          FROM "BehaviorEmbedding"
          WHERE address = ${address}
        `;
                const embedding = embeddingResult.length > 0
                    ? JSON.parse(embeddingResult[0].embedding)
                    : null;
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                found: true,
                                address,
                                investigatedAt: profile.investigatedAt,
                                transactionCount: transactions.length,
                                transactions: transactions.slice(0, 20),
                                hasEmbedding: !!embedding,
                            }, null, 2),
                        },
                    ],
                };
            }
            case "search_similar": {
                const { address, limit = 10 } = args;
                if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
                    throw new Error("Invalid Ethereum address format");
                }
                // Get the query embedding
                const queryEmbedding = await prisma.$queryRaw `
          SELECT embedding::text as embedding
          FROM "BehaviorEmbedding"
          WHERE address = ${address}
        `;
                if (queryEmbedding.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    error: "No embedding found for address",
                                    address,
                                }, null, 2),
                            },
                        ],
                    };
                }
                const embeddingStr = queryEmbedding[0].embedding;
                // Find similar addresses using vector similarity
                const similar = await prisma.$queryRaw `
          SELECT address, embedding <=> ${embeddingStr}::vector as distance
          FROM "BehaviorEmbedding"
          WHERE address != ${address}
          ORDER BY embedding <=> ${embeddingStr}::vector
          LIMIT ${limit}
        `;
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                query: address,
                                results: similar,
                            }, null, 2),
                        },
                    ],
                };
            }
            case "query_bridges": {
                const { protocol, fromChain, toChain, tokenSymbol } = args;
                const where = {};
                if (protocol)
                    where.protocol = protocol;
                if (fromChain)
                    where.srcChainId = fromChain;
                if (toChain)
                    where.dstChainId = toChain;
                if (tokenSymbol)
                    where.tokenSymbol = tokenSymbol;
                const routes = await prisma.bridgeRoute.findMany({
                    where,
                    orderBy: { observedCount: 'desc' },
                    take: 20,
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                query: { protocol, fromChain, toChain, tokenSymbol },
                                routesFound: routes.length,
                                routes,
                            }, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${errorMessage}`,
                },
            ],
            isError: true,
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Atlas MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
