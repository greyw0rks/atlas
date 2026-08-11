"use client";

import { useState } from "react";
import { AddressInput } from "@/components/AddressInput";
import { ChainTable } from "@/components/ChainTable";
import { Timeline } from "@/components/Timeline";
import { MemoryPanel } from "@/components/MemoryPanel";
import type { BridgeHopData } from "@/lib/tracer";

interface ChainProgress {
  chainKey: string;
  status: "fetching" | "persisting" | "done" | "error";
  transferCount: number;
  pagesFetched: number;
  hasMore: boolean;
  error?: string;
}

interface TraceResult {
  jobId: string;
  rootAddress: string;
  totalTransfers: number;
  chainResults: ChainProgress[];
  durationMs: number;
  bridgeHops: BridgeHopData[];
}

export default function Home() {
  const [isTracing, setIsTracing] = useState(false);
  const [chainResults, setChainResults] = useState<ChainProgress[]>([]);
  const [finalResult, setFinalResult] = useState<TraceResult | null>(null);
  const [error, setError] = useState("");

  const handleTrace = async (address: string) => {
    setIsTracing(true);
    setChainResults([]);
    setFinalResult(null);
    setError("");

    try {
      const response = await fetch("/api/trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Request failed");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const event = JSON.parse(line);

            if ("jobId" in event) {
              // Final result
              setFinalResult(event as TraceResult);
              setChainResults(event.chainResults);
            } else {
              // Progress update
              setChainResults((prev) => {
                const existing = prev.find(
                  (r) => r.chainKey === event.chainKey,
                );
                if (existing) {
                  return prev.map((r) =>
                    r.chainKey === event.chainKey ? event : r,
                  );
                }
                return [...prev, event];
              });
            }
          } catch (e) {
            console.error("Failed to parse line:", line, e);
          }
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsTracing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-12">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Atlas</h1>
            <p className="text-slate-400">
              Cross-chain EVM wallet tracer with persistent memory
            </p>
          </div>

          {/* Input */}
          <AddressInput onSubmit={handleTrace} disabled={isTracing} />

          {/* Error */}
          {error && (
            <div className="w-full max-w-2xl p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Results */}
          {chainResults.length > 0 && (
            <div className="w-full flex flex-col items-center gap-6">
              {/* Memory Panel - shown before results if address has history */}
              {finalResult && (
                <MemoryPanel address={finalResult.rootAddress} />
              )}

              {finalResult && (
                <div className="w-full max-w-4xl p-4 bg-slate-900 border border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Job ID</p>
                      <p className="font-mono text-sm">{finalResult.jobId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Total Transfers</p>
                      <p className="text-2xl font-bold text-sky-400">
                        {finalResult.totalTransfers.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Duration</p>
                      <p className="font-mono">
                        {(finalResult.durationMs / 1000).toFixed(1)}s
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <ChainTable results={chainResults} />

              {finalResult && finalResult.bridgeHops && (
                <Timeline hops={finalResult.bridgeHops} />
              )}

              {isTracing && (
                <p className="text-sm text-slate-500 animate-pulse">
                  Tracing in progress...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
