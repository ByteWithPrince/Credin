'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Zap, Target, TrendingDown, Layers, RefreshCw, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { getPersonaState, optimize } from '@/lib/api';
import { OptimizerResult } from '@/lib/types';
import { formatINR, toNumber } from '@/lib/format';

export default function AccountsOptimizerPage() {
  const [userId, setUserId] = useState<string>("00000000-0000-0000-0000-000000000001");
  const [financialState, setFinancialState] = useState<any>(null);
  const [budget, setBudget] = useState<number>(35000);
  const [minBudget, setMinBudget] = useState<number>(20000);
  const [maxBudget, setMaxBudget] = useState<number>(60000);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("avalanche");
  const [optimizerResults, setOptimizerResults] = useState<OptimizerResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const u = params.get('user');
      if (u) setUserId(u);
    }
  }, []);

  // Load persona accounts and initial budget range
  useEffect(() => {
    setLoading(true);
    getPersonaState(userId)
      .then((res) => {
        setFinancialState(res.state);
        const debtAccounts = res.state.accounts.filter(
          (a) => a.closed_date === null && parseFloat(a.balance) > 0
        );
        let sumMins = 0;
        debtAccounts.forEach((a) => {
          if (a.min_payment) sumMins += parseFloat(a.min_payment);
          else if (a.emi) sumMins += parseFloat(a.emi);
          else sumMins += parseFloat(a.balance) * 0.05;
        });

        const income = parseFloat(res.state.monthly_income) || 72000;
        const rent = parseFloat(res.state.rent) || 20000;
        const exp = parseFloat(res.state.other_expenses) || 16000;
        const surplus = Math.max(0, income - rent - exp);

        const initialMin = Math.ceil(sumMins / 100) * 100;
        const initialMax = Math.ceil((sumMins + surplus) / 100) * 100;

        setMinBudget(initialMin);
        setMaxBudget(Math.max(initialMax, initialMin + 10000));
        setBudget(Math.min(initialMin + 15000, initialMax));
      })
      .catch((err) => {
        setError(err.message || "Failed to load accounts");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  // Debounced optimization calculation
  useEffect(() => {
    if (!financialState || budget < minBudget) return;

    const timer = setTimeout(() => {
      optimize({
        user_id: userId,
        monthly_budget: budget.toString(),
      })
        .then((res) => {
          if (Array.isArray(res)) {
            setOptimizerResults(res);
          } else {
            setOptimizerResults([res]);
          }
        })
        .catch((err) => {
          setError(err.message || "Optimization failed");
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [userId, budget, financialState, minBudget]);

  const activeResult = optimizerResults.find((r) => r.strategy === selectedStrategy) || optimizerResults[0];

  // Prepare chart comparison data (merge monthly timelines)
  const chartData = useMemo(() => {
    if (!optimizerResults.length) return [];
    const maxMonths = Math.max(...optimizerResults.map((r) => r.months_to_debt_free), 12);
    const data = [];

    for (let m = 0; m <= maxMonths; m++) {
      const pt: any = { month: m };
      optimizerResults.forEach((res) => {
        const timelinePt = res.monthly_timeline.find((t) => t.month === m);
        if (timelinePt) {
          pt[res.strategy] = toNumber(timelinePt.total_balance);
        } else if (m > res.months_to_debt_free) {
          pt[res.strategy] = 0;
        }
      });
      data.push(pt);
    }
    return data;
  }, [optimizerResults]);

  const strategyIcons: Record<string, any> = {
    avalanche: Zap,
    snowball: Target,
    credit_optimized: TrendingDown,
    balanced: Layers,
  };

  const strategyNames: Record<string, string> = {
    avalanche: "Avalanche (Highest APR first)",
    snowball: "Snowball (Smallest Balance first)",
    credit_optimized: "Credit-Optimized (Highest Utilization first)",
    balanced: "Balanced (Hybrid APR + Utilization)",
  };

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
            CredIn <span className="text-xs text-primary font-sans font-medium px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30">Debt Optimizer</span>
          </div>
        </div>

        <nav className="flex items-center gap-4 text-sm font-medium text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">
            Simulator
          </Link>
          <Link href={`/score?user=${userId}`} className="hover:text-white transition-colors">
            Health Score
          </Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10 flex flex-col gap-8">
        {loading ? (
          <div className="liquid-glass rounded-3xl p-12 flex flex-col items-center justify-center gap-4 min-h-[400px]">
            <RefreshCw size={28} className="animate-spin text-primary" />
            <p className="text-sm text-zinc-400">Loading debt accounts and payoff schedules...</p>
          </div>
        ) : (
          <>
            {/* Page Title */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payoff Rollover Engine
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Debt Free Roadmap for {financialState?.display_name || "User"}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Compare deterministic payoff schedules. Every freed minimum payment rolls into your next target debt for maximum velocity.
              </p>
            </div>

            {/* Account List */}
            <div className="liquid-glass rounded-3xl p-6 sm:p-8 flex flex-col gap-4 border border-white/10 shadow-xl">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Active Debt Accounts
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {financialState?.accounts
                  ?.filter((a: any) => a.closed_date === null && parseFloat(a.balance) > 0)
                  .map((acc: any) => (
                    <div
                      key={acc.id}
                      className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white">{acc.display_name}</h3>
                          <span className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded bg-primary/10">
                            {acc.interest_rate}% APR
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {acc.kind.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between border-t border-border/40 pt-2 text-xs">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground">Balance</span>
                          <span className="font-semibold text-white">{formatINR(acc.balance)}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-muted-foreground">Min / EMI</span>
                          <span className="font-semibold text-zinc-300">
                            {formatINR(acc.min_payment || acc.emi || (parseFloat(acc.balance) * 0.05))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Monthly Budget Slider */}
            <div className="liquid-glass rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-white/10 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Monthly Payoff Budget
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Floor is mandatory minimum payments ({formatINR(minBudget)})
                  </p>
                </div>
                <div className="font-orbitron font-bold text-2xl sm:text-3xl text-primary">
                  {formatINR(budget)} / mo
                </div>
              </div>

              <input
                type="range"
                min={minBudget}
                max={maxBudget}
                step={500}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-zinc-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>Min: {formatINR(minBudget)}</span>
                <span>Max: {formatINR(maxBudget)}</span>
              </div>
            </div>

            {/* Strategy Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {optimizerResults.map((res) => {
                const Icon = strategyIcons[res.strategy] || Zap;
                const isSelected = res.strategy === selectedStrategy;
                const isWinner = res.strategy === "avalanche";

                return (
                  <button
                    key={res.strategy}
                    type="button"
                    onClick={() => setSelectedStrategy(res.strategy)}
                    className={`liquid-glass rounded-2xl p-5 text-left flex flex-col justify-between gap-4 transition-all relative ${
                      isSelected
                        ? 'border-primary shadow-[0_0_25px_rgba(147,51,234,0.3)] bg-white/[0.06]'
                        : 'hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-primary text-white' : 'bg-white/10 text-zinc-300'}`}>
                          <Icon size={18} />
                        </div>
                        {isWinner && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                            Saves Most
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white capitalize">{res.strategy.replace('_', ' ')}</h3>
                      <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                        {strategyNames[res.strategy]?.split('(')[1]?.replace(')', '') || ''}
                      </span>
                    </div>

                    <div className="border-t border-border/40 pt-3 flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-bold text-white">{res.months_to_debt_free} Months</span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-muted-foreground">Interest:</span>
                        <span className="font-bold text-primary">{formatINR(res.total_interest_paid)}</span>
                      </div>
                      {parseFloat(res.interest_saved_vs_worst.toString()) > 0 && (
                        <div className="text-[10px] text-emerald-400 font-medium">
                          Saves {formatINR(res.interest_saved_vs_worst)} vs worst
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Payoff Timeline Chart */}
            <div className="liquid-glass rounded-3xl p-6 sm:p-8 flex flex-col gap-6 border border-white/10 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Payoff Trajectory Comparison
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Projected remaining balance across months for each strategy
                  </p>
                </div>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis
                      dataKey="month"
                      stroke="#71717a"
                      fontSize={12}
                      tickFormatter={(val) => `M${val}`}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={12}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#19191b',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                      formatter={(value: any) => [formatINR(value), 'Balance']}
                      labelFormatter={(label) => `Month ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avalanche"
                      name="Avalanche"
                      stroke="#9333ea"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="snowball"
                      name="Snowball"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="credit_optimized"
                      name="Credit-Optimized"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="balanced"
                      name="Balanced"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      strokeDasharray="2 2"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Recommended Payoff Order for Selected Strategy */}
              {activeResult && activeResult.payoff_order.length > 0 && (
                <div className="border-t border-border/40 pt-5 flex flex-col gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Target Payoff Order ({activeResult.strategy.toUpperCase()})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {activeResult.payoff_order.map((name, i) => (
                      <div
                        key={i}
                        className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                            {i + 1}
                          </span>
                          <span className="font-semibold text-white">{name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle size={14} className="text-emerald-400" /> Target #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collapsible Accessible Data Table */}
              <div className="border-t border-border/40 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTable(!showTable)}
                  className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  {showTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showTable ? "Hide Raw Data Table" : "Show Accessible Raw Data Table"}
                </button>

                {showTable && (
                  <div className="mt-4 overflow-x-auto max-h-60 overflow-y-auto rounded-xl border border-border/60">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-white/5 text-muted-foreground sticky top-0">
                        <tr>
                          <th className="p-2.5">Month</th>
                          <th className="p-2.5">Avalanche</th>
                          <th className="p-2.5">Snowball</th>
                          <th className="p-2.5">Credit-Optimized</th>
                          <th className="p-2.5">Balanced</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {chartData.map((row) => (
                          <tr key={row.month} className="hover:bg-white/[0.02]">
                            <td className="p-2 font-bold text-white">Mo {row.month}</td>
                            <td className="p-2">{formatINR(row.avalanche || 0)}</td>
                            <td className="p-2">{formatINR(row.snowball || 0)}</td>
                            <td className="p-2">{formatINR(row.credit_optimized || 0)}</td>
                            <td className="p-2">{formatINR(row.balanced || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
