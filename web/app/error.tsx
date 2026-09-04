'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error caught by backstop:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-foreground relative flex flex-col items-center justify-center p-6 select-none">
      <div className="absolute inset-0 bg-grid-minimal mask-radial-faded pointer-events-none z-0" />

      <div className="liquid-glass rounded-3xl p-8 max-w-md w-full flex flex-col items-center text-center gap-5 relative z-10 border border-white/10 shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-400 flex items-center justify-center">
          <AlertCircle size={24} />
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="font-orbitron font-bold text-xl text-white">Temporary System Glitch</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {error.message && !error.message.includes("digest")
              ? error.message
              : "A service request could not be completed. Your simulation data is preserved."}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 liquid-glass-btn bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all"
          >
            <RefreshCw size={14} /> Try Again
          </button>
          <Link
            href="/"
            className="flex-1 liquid-glass-btn text-zinc-300 hover:text-white py-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-all"
          >
            <Home size={14} /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
