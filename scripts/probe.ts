// Manual verification harness — not part of the app.
//   npx tsx scripts/probe.ts <address> [chainKey]
// Fetches one page from both endpoints and prints normalized output so the
// numbers can be eyeballed against the public explorer UI.

import { BlockscoutAdapter } from "@/lib/adapters/blockscout";
import { CHAINS, TRACED_CHAINS, isChainKey, type ChainKey } from "@/lib/chains";
import type { Address } from "@/lib/adapters/types";

function formatAmount(raw: string, decimals: number): string {
  const padded = raw.padStart(decimals + 1, "0");
  const whole = padded.slice(0, padded.length - decimals);
  const frac = decimals ? padded.slice(padded.length - decimals).replace(/0+$/, "") : "";
  return frac ? `${whole}.${frac.slice(0, 6)}` : whole;
}

async function probe(address: Address, chainKey: ChainKey) {
  const adapter = new BlockscoutAdapter(chainKey);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  const label = CHAINS[chainKey].name;

  try {
    const started = Date.now();
    const [native, tokens] = await Promise.all([
      adapter.fetchTransfers(address, "transactions", null, controller.signal),
      adapter.fetchTransfers(address, "token-transfers", null, controller.signal),
    ]);
    const elapsed = Date.now() - started;

    console.log(
      `\n=== ${label} === ${elapsed}ms | native ${native.transfers.length} | erc20 ${tokens.transfers.length} | more: ${Boolean(native.cursor)}/${Boolean(tokens.cursor)}`,
    );

    for (const t of [...native.transfers, ...tokens.transfers].slice(0, 4)) {
      console.log(
        `  ${t.direction.padEnd(4)} ${formatAmount(t.rawAmount, t.tokenDecimals).padStart(14)} ${(t.tokenSymbol ?? "?").padEnd(8)} ` +
          `${t.timestamp.toISOString().slice(0, 10)} ${t.txHash.slice(0, 12)}… ${t.method ?? ""}`,
      );
    }

    const all = [...native.transfers, ...tokens.transfers];
    const bad = all.filter((t) => !/^\d+$/.test(t.rawAmount));
    const unrelated = all.filter(
      (t) => t.from !== address.toLowerCase() && t.to !== address.toLowerCase(),
    );
    const keys = new Set(all.map((t) => `${t.txHash}:${t.logIndex ?? -1}`));
    console.log(
      `  checks: amounts ${bad.length === 0 ? "ok" : `BAD(${bad.length})`} | ` +
        `subject-related ${unrelated.length === 0 ? "ok" : `BAD(${unrelated.length})`} | ` +
        `unique keys ${keys.size === all.length ? "ok" : `DUPES(${all.length - keys.size})`}`,
    );
  } catch (error) {
    console.log(`\n=== ${label} === FAILED: ${(error as Error).message}`);
  } finally {
    clearTimeout(timer);
  }
}

const address = (process.argv[2] ?? "").toLowerCase() as Address;
if (!/^0x[0-9a-f]{40}$/.test(address)) {
  console.error("usage: npx tsx scripts/probe.ts <0x-address> [chainKey]");
  process.exit(1);
}

const arg = process.argv[3];
const chains: ChainKey[] = arg && isChainKey(arg) ? [arg] : TRACED_CHAINS;
Promise.all(chains.map((c) => probe(address, c)));
