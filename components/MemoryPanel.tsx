"use client";

import { useEffect, useState } from "react";

interface AddressProfile {
  address: string;
  observationCount: number;
  degree: number;
  chainIds: number[];
  bridgeProtocols: string[];
  topTokens: Array<{ symbol: string; volume: string }>;
  behaviorText: string;
  lastSeen: string;
}

interface SimilarAddress {
  address: string;
  distance: number;
  observationCount: number;
  degree: number;
  behaviorText: string;
}

interface RoutePrior {
  protocol: string;
  fromChain: number;
  toChain: number;
  tokenSymbol: string;
  sampleSize: number;
  medianFeeUsd: string;
  p90LatencySeconds: number;
}

interface MemoryPanelProps {
  address: string;
}

export function MemoryPanel({ address }: MemoryPanelProps) {
  const [profile, setProfile] = useState<AddressProfile | null>(null);
  const [similar, setSimilar] = useState<SimilarAddress[]>([]);
  const [routes, setRoutes] = useState<RoutePrior[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMemory = async () => {
      setLoading(true);
      setError("");

      try {
        // Fetch profile
        const profileRes = await fetch(`/api/memory/profile/${address}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);

          // Fetch similar addresses if profile has embedding
          if (profileData.embedding) {
            const similarRes = await fetch(
              `/api/memory/similar/${address}?limit=5`
            );
            if (similarRes.ok) {
              const similarData = await similarRes.json();
              setSimilar(similarData.similar || []);
            }
          }

          // Fetch route priors for observed protocols
          if (profileData.bridgeProtocols && profileData.bridgeProtocols.length > 0) {
            const routePromises = profileData.bridgeProtocols.map((protocol: string) =>
              fetch(`/api/memory/routes?protocol=${protocol}`).then(r => r.ok ? r.json() : { routes: [] })
            );
            const routeResults = await Promise.all(routePromises);
            const allRoutes = routeResults.flatMap(r => r.routes || []);
            setRoutes(allRoutes);
          }
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchMemory();
  }, [address]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl p-6 bg-slate-900 border border-slate-700 rounded-lg">
        <p className="text-sm text-slate-400 animate-pulse">Loading memory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-sm text-red-400">Memory error: {error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full max-w-4xl p-6 bg-slate-900 border border-slate-700 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-300">Cold start</p>
            <p className="text-sm text-slate-500 mt-1">
              This is the first time Atlas has seen {address.slice(0, 8)}...
              Memory will be written after this trace completes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl flex flex-col gap-4">
      {/* Profile header */}
      <div className="p-6 bg-slate-900 border border-slate-700 rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <h3 className="text-lg font-semibold text-slate-100">Memory</h3>
            </div>
            <p className="text-xs text-slate-500 font-mono">{address}</p>
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400">Observations</p>
              <p className="text-xl font-bold text-sky-400">{profile.observationCount}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Degree</p>
              <p className="text-xl font-bold text-cyan-400">{profile.degree}</p>
            </div>
          </div>
        </div>

        {/* Behavior text */}
        <div className="mb-4 p-4 bg-slate-950 border border-slate-800 rounded">
          <p className="text-sm text-slate-300 leading-relaxed">{profile.behaviorText}</p>
        </div>

        {/* Chains and protocols */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-2">Chains</p>
            <div className="flex flex-wrap gap-1">
              {profile.chainIds.map(chainId => (
                <span
                  key={chainId}
                  className="px-2 py-1 text-xs font-mono bg-slate-800 text-slate-300 rounded"
                >
                  {chainId}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2">Protocols</p>
            <div className="flex flex-wrap gap-1">
              {profile.bridgeProtocols.map(protocol => (
                <span
                  key={protocol}
                  className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded"
                >
                  {protocol}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Top tokens */}
        {profile.topTokens && profile.topTokens.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-slate-400 mb-2">Top tokens</p>
            <div className="flex flex-wrap gap-2">
              {profile.topTokens.slice(0, 5).map((token, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded flex items-baseline gap-2"
                >
                  <span className="text-sm font-medium text-slate-200">{token.symbol}</span>
                  <span className="text-xs text-slate-500 font-mono">{token.volume}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Similar addresses */}
      {similar.length > 0 && (
        <div className="p-6 bg-slate-900 border border-slate-700 rounded-lg">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Similar addresses</h4>
          <div className="space-y-2">
            {similar.map((addr) => (
              <div
                key={addr.address}
                className="p-3 bg-slate-950 border border-slate-800 rounded hover:border-sky-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-xs font-mono text-slate-400">{addr.address}</p>
                  <span className="text-xs text-slate-500">
                    similarity: {(1 - addr.distance).toFixed(3)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {addr.behaviorText.slice(0, 120)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Route priors */}
      {routes.length > 0 && (
        <div className="p-6 bg-slate-900 border border-slate-700 rounded-lg">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Learned routes</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Protocol</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Route</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Token</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Median fee</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">P90 latency</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">n</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route, i) => (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-slate-300">{route.protocol}</td>
                    <td className="py-2 px-3 text-slate-400 font-mono">
                      {route.fromChain} → {route.toChain}
                    </td>
                    <td className="py-2 px-3 text-slate-300">{route.tokenSymbol}</td>
                    <td className="py-2 px-3 text-right text-slate-400 font-mono">
                      ${parseFloat(route.medianFeeUsd).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400 font-mono">
                      {route.p90LatencySeconds}s
                    </td>
                    <td className="py-2 px-3 text-right text-slate-500">{route.sampleSize}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}