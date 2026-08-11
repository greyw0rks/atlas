// Quick verification that the tracer orchestration and persistence work.
//   npx tsx scripts/test-tracer.ts <address>
//
// Runs a full 6-chain trace and prints progress. Does not start a dev server —
// this is a direct test of lib/tracer.ts against the real database.

import { traceAddress } from "@/lib/tracer";
import type { Address } from "@/lib/adapters/types";

const address = (process.argv[2] ?? "").toLowerCase() as Address;
if (!/^0x[0-9a-f]{40}$/.test(address)) {
  console.error("usage: npx tsx scripts/test-tracer.ts <0x-address>");
  process.exit(1);
}

console.log(`\n🔍 Tracing ${address} across 6 chains...\n`);

(async () => {
  try {
    for await (const event of traceAddress(address)) {
      if ("jobId" in event) {
        // Final result
        console.log(`\n✅ COMPLETE`);
        console.log(`   Job ID: ${event.jobId}`);
        console.log(`   Total transfers: ${event.totalTransfers}`);
        console.log(`   Duration: ${(event.durationMs / 1000).toFixed(1)}s`);
        console.log(`\n   Per-chain breakdown:`);
        for (const chain of event.chainResults) {
          const status =
            chain.status === "done" ? "✓" :
            chain.status === "error" ? "✗" : "○";
          console.log(
            `   ${status} ${chain.chainKey.padEnd(10)} ${chain.transferCount.toString().padStart(4)} transfers, ${chain.pagesFetched} pages${chain.hasMore ? " (truncated)" : ""}${chain.error ? ` — ${chain.error}` : ""}`,
          );
        }
      } else {
        // Progress update
        const emoji =
          event.status === "fetching" ? "🔄" :
          event.status === "persisting" ? "💾" :
          event.status === "done" ? "✅" :
          event.status === "error" ? "❌" : "⚪";
        console.log(
          `${emoji} ${event.chainKey.padEnd(10)} ${event.status.padEnd(10)} ${event.transferCount.toString().padStart(4)} transfers, ${event.pagesFetched} pages`,
        );
      }
    }
  } catch (error) {
    console.error(`\n❌ FAILED: ${(error as Error).message}`);
    process.exit(1);
  }
})();
