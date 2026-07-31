// Manual verification harness — not part of the app.
//   npx tsx scripts/probe-logs.ts <chainKey> <txHash>
// Confirms decoded event names + params come back, which is what deterministic
// bridge matching depends on.

import { BlockscoutAdapter } from "@/lib/adapters/blockscout";
import { isChainKey } from "@/lib/chains";
import type { Hash } from "@/lib/adapters/types";

const chainKey = process.argv[2];
const txHash = process.argv[3];

if (!chainKey || !isChainKey(chainKey) || !/^0x[0-9a-fA-F]{64}$/.test(txHash ?? "")) {
  console.error("usage: npx tsx scripts/probe-logs.ts <chainKey> <txHash>");
  process.exit(1);
}

const adapter = new BlockscoutAdapter(chainKey);
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 45_000);

adapter
  .fetchTxLogs(txHash as Hash, controller.signal)
  .then((logs) => {
    const decoded = logs.filter((l) => l.eventName);
    console.log(`logs: ${logs.length} | decoded: ${decoded.length}`);
    for (const log of logs) {
      console.log(`\n[${log.logIndex}] ${log.eventName ?? "(undecoded)"} @ ${log.address}`);
      for (const p of log.params) {
        const value = p.value.length > 74 ? `${p.value.slice(0, 74)}…` : p.value;
        console.log(`     ${p.indexed ? "idx " : "    "}${p.name}: ${p.type} = ${value}`);
      }
    }
  })
  .catch((error) => console.error("FAILED:", (error as Error).message))
  .finally(() => clearTimeout(timer));
