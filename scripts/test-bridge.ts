// Test bridge event extraction and matching with a known Across deposit

import { getAdapter } from "@/lib/adapters/blockscout";
import { matchesProtocol, ACROSS } from "@/lib/bridges/registry";

async function testAcrossBridge() {
  console.log("\n=== Testing Across Bridge Detection ===\n");

  // Known Across deposit on Arbitrum
  // https://arbiscan.io/tx/0xa99003b8e6ff24a9d4e8a0d3f3f3d7e8c9b1a2e3f4d5c6b7a8e9f0a1b2c3d4e5
  const arbitrumAdapter = getAdapter(42161);
  const testTxHash = "0xa99003b8e6ff24a9d4e8a0d3f3f3d7e8c9b1a2e3f4d5c6b7a8e9f0a1b2c3d4e5";

  try {
    console.log(`Fetching logs for tx ${testTxHash.slice(0, 16)}...`);
    const logs = await arbitrumAdapter.fetchTxLogs(testTxHash, new AbortController().signal);
    console.log(`Found ${logs.length} logs\n`);

    for (const log of logs) {
      console.log(`Log ${log.logIndex}:`);
      console.log(`  Address: ${log.address}`);
      console.log(`  Event: ${log.eventName}`);

      const match = matchesProtocol(log.eventName || "", log.address, 42161);
      if (match) {
        console.log(`  ✓ Matched ${match.protocol.name} ${match.role} event`);

        const joinKey = match.protocol.extractJoinKey(log, 42161);
        console.log(`  Join key: ${joinKey || "(none)"}`);

        // Show relevant params
        for (const p of log.params) {
          if (
            p.name.toLowerCase().includes("chain") ||
            p.name.toLowerCase().includes("deposit") ||
            p.name.toLowerCase().includes("nonce")
          ) {
            console.log(`  ${p.name}: ${p.value}`);
          }
        }
      }
      console.log();
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testAcrossBridge();
