import React from 'react';

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-black text-foreground relative flex flex-col justify-between w-full">
      <div className="absolute inset-0 bg-grid-minimal mask-radial-faded pointer-events-none z-0" />

      {/* Header Skeleton */}
      <header className="w-full px-6 sm:px-12 py-6 flex justify-between items-center relative z-10 border-b border-border/40">
        <div className="h-7 w-28 bg-white/10 rounded-lg animate-pulse" />
        <div className="flex gap-4">
          <div className="h-5 w-20 bg-white/5 rounded animate-pulse" />
          <div className="h-5 w-24 bg-white/5 rounded animate-pulse" />
        </div>
      </header>

      {/* Main Skeleton */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10 flex flex-col gap-8">
        {/* Hero title skeleton */}
        <div className="flex flex-col items-center gap-3 max-w-2xl mx-auto w-full">
          <div className="h-10 w-3/4 bg-white/10 rounded-2xl animate-pulse" />
          <div className="h-4 w-1/2 bg-white/5 rounded-lg animate-pulse" />
        </div>

        {/* 3 cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="liquid-glass rounded-2xl p-6 h-36 animate-pulse border border-white/5 bg-white/[0.02]" />
          <div className="liquid-glass rounded-2xl p-6 h-36 animate-pulse border border-white/5 bg-white/[0.02]" />
          <div className="liquid-glass rounded-2xl p-6 h-36 animate-pulse border border-white/5 bg-white/[0.02]" />
        </div>

        {/* Action card skeleton */}
        <div className="liquid-glass rounded-3xl p-8 h-48 animate-pulse border border-white/5 bg-white/[0.02]" />
      </main>
    </div>
  );
}
