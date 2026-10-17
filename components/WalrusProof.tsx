"use client";

export interface ChainVerification {
  provider: string;
  network: string;
  verifiedAt: string;
  objects: Array<{ id: string; type?: string; owner?: string }>;
  transactions: Array<{ digest: string; status: string }>;
  errors: Array<{ ref: string; error: string }>;
}

/**
 * The proof footer for a memory or decision: the mainnet blob link plus the
 * Tatum verification state. A row with no blob id shows nothing, because there
 * is nothing to point at.
 */
export function WalrusProof({
  blobId,
  chainVerification,
}: {
  blobId: string | null;
  chainVerification: ChainVerification | null;
}) {
  if (!blobId) return null;

  const shortBlob = `${blobId.slice(0, 10)}…${blobId.slice(-6)}`;
  const verified =
    chainVerification &&
    (chainVerification.objects.length > 0 ||
      chainVerification.transactions.length > 0) &&
    chainVerification.errors.length === 0;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-[#1E2636] text-xs">
      <a
        href={`https://aggregator.walrus-mainnet.walrus.space/v1/blobs/${blobId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[#8B5CF6] hover:text-[#A78BFA]"
        title="Walrus blob id — the onchain proof of this memory"
      >
        Walrus blob {shortBlob}
      </a>
      {verified && (
        <span className="px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981]">
          Tatum verified
        </span>
      )}
      {chainVerification && !verified && (
        <span className="px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]">
          {chainVerification.errors.length} unverified ref
          {chainVerification.errors.length === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}
