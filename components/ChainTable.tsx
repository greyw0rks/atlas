"use client";

interface ChainProgress {
  chainKey: string;
  status: "fetching" | "persisting" | "done" | "error";
  transferCount: number;
  pagesFetched: number;
  hasMore: boolean;
  error?: string;
}

interface ChainTableProps {
  results: ChainProgress[];
}

export function ChainTable({ results }: ChainTableProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
              Chain
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
              Status
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">
              Transfers
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">
              Pages
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((chain) => (
            <tr
              key={chain.chainKey}
              className="border-b border-slate-800 hover:bg-slate-900/50"
            >
              <td className="py-3 px-4 text-sm font-mono text-slate-200">
                {chain.chainKey}
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={chain.status} />
              </td>
              <td className="py-3 px-4 text-right text-sm font-mono text-slate-300">
                {chain.transferCount.toLocaleString()}
              </td>
              <td className="py-3 px-4 text-right text-sm font-mono text-slate-400">
                {chain.pagesFetched}
              </td>
              <td className="py-3 px-4 text-sm text-slate-400">
                {chain.hasMore && (
                  <span className="text-orange-400">Truncated</span>
                )}
                {chain.error && (
                  <span className="text-red-400">{chain.error}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: ChainProgress["status"] }) {
  const variants = {
    fetching: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    persisting: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    done: "bg-green-500/10 text-green-400 border-green-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const labels = {
    fetching: "Fetching",
    persisting: "Saving",
    done: "Done",
    error: "Error",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${variants[status]}`}
    >
      {labels[status]}
    </span>
  );
}
