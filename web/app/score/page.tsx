'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import { getUserScore } from '@/lib/api';
import { bandBadgeClass } from '@/lib/format';
import { getSeededScore } from '@/lib/demoCache';

export default function ScorePage() {
  const [userId, setUserId] = useState<string>("00000000-0000-0000-0000-000000000001");
  const [scoreData, setScoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read user param from URL if present
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const u = params.get('user');
      if (u) setUserId(u);
    }
  }, []);

  const fetchScore = (uid: string) => {
    setLoading(true);
    setError(null);
    getUserScore(uid)
      .then((res) => {
        setScoreData(res);
      })
      .catch((err) => {
        console.warn("Live score fetch failed; using seeded fallback for presentation safety:", err);
        const fallback = getSeededScore(uid);
        if (fallback) {
          setScoreData(fallback);
          setError(null);
        } else {
          setError(err.message || "Failed to load health score.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchScore(userId);
  }, [userId]);

  // Fix questions mapped for each component
  const fixQuestions: Record<string, string> = {
    utilization: "What if I pay ₹50,000 toward my HDFC card?",
    foir: "Can I pay down debt to lower my monthly obligations?",
    emergency: "How much savings do I need for a 6-month emergency runway?",
    age_mix: "Should I keep my older credit accounts active?",
    payment: "How will on-time payments improve my score over 6 months?",
    cash_flow: "How can I increase my monthly savings surplus?",
  };

  const componentsList = scoreData?.components
    ? Object.entries(scoreData.components).map(([key, val]: [string, any]) => ({
        key,
        ...val,
      }))
    : [];

  // Sort weakest first
  componentsList.sort((a, b) => a.score - b.score);

  const overall = scoreData?.overall || 0;
  const band = scoreData?.band || "Fair";

  // SVG Gauge calculations (radius 70, circumference = 2 * PI * 70 = 439.82)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overall / 100) * circumference;

  return (
    <div className="min-h-screen bg-black text-foreground relative overflow-hidden flex flex-col justify-between w-full">
      <div className="absolute inset-0 bg-grid-minimal mask-radial-faded pointer-events-none z-0" />

      {/* Header */}
      <header className="w-full px-6 sm:px-12 py-6 flex justify-between items-center relative z-10 border-b border-border/40">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="liquid-glass-btn p-2.5 rounded-full text-zinc-300 hover:text-white transition-all flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="font-orbitron font-bold text-xl tracking-wider text-white">
            CredIn <span className="text-xs text-primary font-sans font-medium px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30">Health Score</span>
          </div>
        </div>

        <nav className="flex items-center gap-4 text-sm font-medium text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">
            Simulator
          </Link>
          <Link href={`/accounts?user=${userId}`} className="hover:text-white transition-colors">
            Debt Optimizer
          </Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 relative z-10 flex flex-col gap-8">
        {loading ? (
          <div className="liquid-glass rounded-3xl p-12 flex flex-col items-center justify-center gap-4 min-h-[400px]">
            <RefreshCw size={28} className="animate-spin text-primary" />
            <p className="text-sm text-zinc-400">Calculating six-component health score...</p>
          </div>
        ) : error ? (
          <div className="liquid-glass rounded-3xl p-8 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => fetchScore(userId)}
              className="liquid-glass-btn px-6 py-2 rounded-xl text-xs font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Top Score Gauge Card */}
            <div className="liquid-glass rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-8 border border-white/10 shadow-2xl">
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Composite Financial Health
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {scoreData.display_name}&apos;s Score
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${bandBadgeClass(band)}`}>
                    {band} Health Band
                  </span>
                  <span className="text-xs text-zinc-400">0 – 100 composite index</span>
                </div>
                <p className="text-xs text-zinc-400 max-w-md mt-2 leading-relaxed">
                  Calculated deterministically across 6 core pillars: Utilization (25%), Payment History (25%), Debt Load/FOIR (20%), Cash Flow (12%), Emergency Fund (10%), and Credit Age & Mix (8%).
                </p>
              </div>

              {/* Animated SVG Circular Gauge */}
              <div
                className="relative flex items-center justify-center shrink-0"
                role="img"
                aria-label={`Financial health score ${overall} out of 100, ${band}`}
              >
                <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    className="stroke-zinc-800"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="url(#gaugeGrad)"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#9333ea" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-orbitron font-bold text-4xl text-white tracking-tight">
                    {overall}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    / 100
                  </span>
                </div>
              </div>
            </div>

            {/* Component Breakdown - Sorted Weakest First */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Component Factor Breakdown
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Ranked weakest to strongest — address top factors first to optimize score impact
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {componentsList.map((comp, idx) => {
                  const scoreVal = typeof comp.score === 'string' ? parseFloat(comp.score) : comp.score;
                  const fixPrompt = fixQuestions[comp.key] || "What if I pay down my credit balance?";
                  
                  return (
                    <div
                      key={comp.key}
                      className="liquid-glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/5 hover:border-white/15 transition-all"
                    >
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                              #{idx + 1} {comp.key.replace('_', ' & ')}
                            </span>
                            <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-white/5 font-semibold">
                              Weight: {comp.weight}%
                            </span>
                          </div>
                          <span className="font-orbitron font-bold text-sm text-white">
                            {scoreVal.toFixed(1)} / 100
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div
                          className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden"
                          role="progressbar"
                          aria-valuenow={scoreVal}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(100, Math.max(0, scoreVal))}%` }}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                          <span className="text-zinc-300 font-medium">{comp.reading}</span>
                          <span className="text-muted-foreground font-mono">{comp.raw}</span>
                        </div>
                      </div>

                      {/* Deep-link action affordance */}
                      <Link
                        href={`/?user=${userId}`}
                        className="liquid-glass-btn px-4 py-2 rounded-xl text-xs font-semibold text-primary hover:text-white shrink-0 flex items-center gap-1.5 transition-all self-start sm:self-center"
                      >
                        What would fix this? <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
