"use client";

import { useState } from "react";

interface AddressInputProps {
  onSubmit: (address: string) => void;
  disabled?: boolean;
}

export function AddressInput({ onSubmit, disabled }: AddressInputProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleaned = value.trim().toLowerCase();
    if (!/^0x[0-9a-f]{40}$/.test(cleaned)) {
      setError("Invalid address format");
      return;
    }

    onSubmit(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex flex-col gap-2">
        <label htmlFor="address" className="text-sm text-slate-400">
          EVM Address
        </label>
        <div className="flex gap-2">
          <input
            id="address"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f00bEb"
            disabled={disabled}
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 font-mono text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || !value}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
          >
            Trace
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    </form>
  );
}
