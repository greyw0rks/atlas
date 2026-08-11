// Test bridge matching logic with synthetic data

import { matchBridgeEvents } from "@/lib/bridges/matcher";
import { prisma } from "@/lib/db";

async function testMatcher() {
  console.log("\n=== Testing Bridge Matcher Logic ===\n");

  // Create synthetic bridge events - an Across send/recv pair
  const jobId = "test_job_123";

  try {
    // Clean up any existing test data
    await prisma.bridgeHop.deleteMany({});
    await prisma.bridgeEvent.deleteMany({});
    await prisma.transfer.deleteMany({
      where: {
        txHash: {
          in: [
            "0xaaaa000000000000000000000000000000000000000000000000000000000001",
            "0xbbbb000000000000000000000000000000000000000000000000000000000001",
          ],
        },
      },
    });

    // Create a matched pair: Arbitrum deposit → Ethereum fill
    const depositId = "12345";
    const originChainId = 42161;
    const amount = "1000000"; // 1 USDC

    console.log("Creating synthetic Across events...");

    // Create Transfer records first
    const sendTransfer = await prisma.transfer.create({
      data: {
        chainId: 42161,
        txHash: "0xaaaa000000000000000000000000000000000000000000000000000000000001",
        logIndex: 5,
        blockNumber: 100000,
        timestamp: new Date("2024-01-15T10:00:00Z"),
        fromAddr: "0x1111111111111111111111111111111111111111",
        toAddr: "0x2222222222222222222222222222222222222222",
        tokenAddr: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
        tokenSymbol: "USDC",
        rawAmount: amount,
        direction: "OUT",
      },
    });

    const recvTransfer = await prisma.transfer.create({
      data: {
        chainId: 1,
        txHash: "0xbbbb000000000000000000000000000000000000000000000000000000000001",
        logIndex: 3,
        blockNumber: 200000,
        timestamp: new Date("2024-01-15T10:02:00Z"),
        fromAddr: "0x3333333333333333333333333333333333333333",
        toAddr: "0x2222222222222222222222222222222222222222",
        tokenAddr: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        tokenSymbol: "USDC",
        rawAmount: amount,
        direction: "IN",
      },
    });

    // Create BridgeEvents linked to those transfers
    await prisma.bridgeEvent.create({
      data: {
        transferId: sendTransfer.id,
        protocol: "ACROSS",
        role: "SEND",
        joinKey: `${originChainId}:${depositId}`,
        srcChainId: 42161,
        dstChainId: 1,
        recipient: "0x2222222222222222222222222222222222222222",
        rawParams: {},
      },
    });

    await prisma.bridgeEvent.create({
      data: {
        transferId: recvTransfer.id,
        protocol: "ACROSS",
        role: "RECV",
        joinKey: `${originChainId}:${depositId}`,
        srcChainId: 1, // Receive happened on Ethereum
        dstChainId: null,
        recipient: "0x2222222222222222222222222222222222222222",
        rawParams: {},
      },
    });

    console.log("✓ Created 2 bridge events with matching join keys\n");

    // Load the events we just created
    console.log("Running matcher...");
    const events = await prisma.bridgeEvent.findMany({
      where: {
        OR: [
          { transferId: sendTransfer.id },
          { transferId: recvTransfer.id },
        ],
      },
      orderBy: { id: "asc" },
    });

    // Match logic inline
    const sendsByKey = new Map<string, typeof events>();
    const recvsByKey = new Map<string, typeof events>();

    for (const evt of events) {
      if (!evt.joinKey) continue;
      const key = `${evt.protocol}:${evt.joinKey}`;

      if (evt.role === "SEND") {
        const sends = sendsByKey.get(key) ?? [];
        sends.push(evt);
        sendsByKey.set(key, sends);
      } else if (evt.role === "RECV") {
        const recvs = recvsByKey.get(key) ?? [];
        recvs.push(evt);
        recvsByKey.set(key, recvs);
      }
    }

    const matchedHops = [];
    for (const [key, sends] of sendsByKey.entries()) {
      const recvs = recvsByKey.get(key);
      if (!recvs) continue;

      for (const send of sends) {
        for (const recv of recvs) {
          if (send.id === recv.id) continue;
          if (send.srcChainId === recv.srcChainId) continue;

          matchedHops.push({
            srcEventId: send.id,
            dstEventId: recv.id,
            confidence: 1.0,
            matchType: "DETERMINISTIC" as const,
            evidence: {
              joinKey: key,
              protocol: send.protocol,
              srcChain: send.srcChainId,
              dstChain: recv.srcChainId,
            },
          });
        }
      }
    }

    console.log(`\nFound ${matchedHops.length} bridge hop(s)\n`);

    // Insert hops
    if (matchedHops.length > 0) {
      await prisma.bridgeHop.createMany({
        data: matchedHops,
        skipDuplicates: true,
      });
    }

    // Verify expectations
    if (matchedHops.length !== 1) {
      console.error(`❌ Expected 1 hop, got ${matchedHops.length}`);
      process.exit(1);
    }

    const hop = matchedHops[0];
    if (hop.matchType !== "DETERMINISTIC") {
      console.error(`❌ Expected DETERMINISTIC match, got ${hop.matchType}`);
      process.exit(1);
    }

    if (hop.confidence !== 1.0) {
      console.error(`❌ Expected confidence 1.0, got ${hop.confidence}`);
      process.exit(1);
    }

    console.log("✓ All assertions passed!");


    // Cleanup
    await prisma.bridgeHop.deleteMany({});
    await prisma.bridgeEvent.deleteMany({});
    await prisma.transfer.deleteMany({
      where: {
        txHash: {
          in: [
            "0xaaaa000000000000000000000000000000000000000000000000000000000001",
            "0xbbbb000000000000000000000000000000000000000000000000000000000001",
          ],
        },
      },
    });

  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testMatcher();
