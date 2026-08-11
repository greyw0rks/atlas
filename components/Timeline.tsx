"use client";

import { useState } from "react";
import type { BridgeHopData } from "@/lib/tracer";

interface TimelineProps {
  hops: BridgeHopData[];
}

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  8453: "Base",
  42161: "Arbitrum",
  10: "Optimism",
  137: "Polygon",
  42220: "Celo",
};

export function Timeline({ hops }: TimelineProps) {
  const [selectedHop, setSelectedHop] = useState<string | null>(null);

  if (hops.length === 0) {
    return (
      <div className="w-full max-w-4xl p-8 bg-slate-900 border border-slate-700 rounded-lg text-center">
        <p className="text-slate-400">No bridge activity detected</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-xl font-bold mb-4">Bridge Timeline</h2>
      <div className="relative bg-slate-900 border border-slate-700 rounded-lg p-6">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-700" />

        {/* Hops */}
        <div className="space-y-8">
          {hops.map((hop) => {
            const isSelected = selectedHop === hop.id;
            const confidencePercent = Math.round(parseFloat(hop.confidence) * 100);

            return (
              <div key={hop.id} className="relative pl-16">
                {/* Timeline dot */}
                <div className="absolute left-6 top-2 w-5 h-5 rounded-full bg-sky-500 border-4 border-slate-900" />

                {/* Hop card */}
                <div
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4 cursor-pointer hover:border-sky-500/50 transition-colors"
                  onClick={() => setSelectedHop(isSelected ? null : hop.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-sky-400">
                        {hop.srcEvent.protocol}
                      </span>
                      <span className="text-xs text-slate-500">
                        {hop.matchType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {confidencePercent}% confidence
                      </span>
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isSelected ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-slate-300">
                      {CHAIN_NAMES[hop.srcEvent.chainId] || `Chain ${hop.srcEvent.chainId}`}
                    </span>
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="font-mono text-slate-300">
                      {CHAIN_NAMES[hop.dstEvent.chainId] || `Chain ${hop.dstEvent.chainId}`}
                    </span>
                  </div>

                  {/* Evidence popover */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Send Transaction</p>
                        <a
                          href={`https://etherscan.io/tx/${hop.srcEvent.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-sky-400 hover:text-sky-300 break-all"
                        >
                          {hop.srcEvent.txHash}
                        </a>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 mb-1">Receive Transaction</p>
                        <a
                          href={`https://etherscan.io/tx/${hop.dstEvent.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-sky-400 hover:text-sky-300 break-all"
                        >
                          {hop.dstEvent.txHash}
                        </a>
                      </div>

                      {hop.srcEvent.joinKey && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Join Key (deterministic match)</p>
                          <p className="font-mono text-xs text-slate-300 break-all bg-slate-950 p-2 rounded">
                            {hop.srcEvent.joinKey}
                          </p>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-700/50">
                        <p className="text-xs text-slate-400 italic">
                          This cross-chain hop was matched using on-chain event data. The join key proves both
                          transactions are part of the same bridge operation.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
