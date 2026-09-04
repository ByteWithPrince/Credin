'use client';

import { useState } from 'react';
import { TrendingUp, ArrowRight, Zap, Target, Sparkles, CheckCircle2, UserCheck, Shield } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { OptimizerResult } from '@/lib/types';
import { optimize } from '@/lib/api';

export default function OptimizerPage() {
  const [selectedPersona, setSelectedPersona] = useState<string>('persona-rohit');
  const [monthlyBudget, setMonthlyBudget] = useState<number>(45000);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('avalanche');
  
  const [results, setResults] = useState<OptimizerResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await optimize({
        user_id: selectedPersona,
        monthly_budget: monthlyBudget,
      });
      setResults(Array.isArray(data) ? data : [data]);
    } catch (err: any) {
      setError(err.message || 'Error running optimizer');
    } finally {
      setIsLoading(false);
    }
  };

  const currentResult = results?.find((r) => r.strategy === selectedStrategy) || results?.[0];


  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 max-w-6xl mx-auto animate-fade-in-up">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="font-orbitron font-bold text-3xl md:text-4xl text-white tracking-tight">Debt Payoff Optimizer</h1>
        <p className="text-muted-foreground text-sm">
          Simulate mathematical payoff acceleration (Avalanche vs. Snowball) with automated payment rollover.
        </p>
      </header>

      {/* Persona Quick-Switch */}
      <div className="bg-card border border-border rounded-2xl p-3 flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase font-medium text-muted-foreground px-3 flex items-center gap-1.5">
          <UserCheck size={14} className="text-primary" /> Active Persona:
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'persona-rohit', name: 'Rohit Sharma (₹90k Card + ₹5L Loan)', budget: 45000 },
            { id: 'persona-priya', name: 'Priya Nair (₹18k Card)', budget: 5000 },
            { id: 'persona-arjun', name: 'Arjun Mehta (₹50k Cards + ₹42L Home Loan)', budget: 85000 },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPersona(p.id);
                setMonthlyBudget(p.budget);
                setResults(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                selectedPersona === p.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-input/60 text-zinc-400 hover:text-white border border-border'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: 'avalanche',
            name: 'Avalanche',
            icon: Zap,
            tagline: 'Highest APR first',
            desc: 'Maximizes total interest saved. Mathematically fastest.',
          },
          {
            id: 'snowball',
            name: 'Snowball',
            icon: Target,
            tagline: 'Smallest balance first',
            desc: 'Quick psychological wins as accounts close fastest.',
          },
          {
            id: 'credit_optimized',
            name: 'Credit Optimized',
            icon: Sparkles,
            tagline: 'Highest utilization first',
            desc: 'Reduces card utilization first to spike score quickly.',
          },
          {
            id: 'balanced',
            name: 'Balanced',
            icon: Shield,
            tagline: 'Rate & balance hybrid',
            desc: 'Balances interest savings with steady milestones.',
          },
        ].map((strat) => {
          const Icon = strat.icon;
          const isSelected = selectedStrategy === strat.id;
          return (
            <button
              key={strat.id}
              onClick={() => setSelectedStrategy(strat.id)}
              className={`flex flex-col gap-2 p-5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-primary/15 border-primary shadow-lg shadow-primary/10'
                  : 'bg-card border-border hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon size={20} className={isSelected ? 'text-primary' : 'text-zinc-400'} />
                {isSelected && <span className="text-[10px] font-semibold bg-primary text-white px-2 py-0.5 rounded-full">ACTIVE</span>}
              </div>
              <strong className="text-white text-base font-semibold">{strat.name}</strong>
              <span className="text-xs text-primary font-medium">{strat.tagline}</span>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">{strat.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Budget & Execution Control */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Monthly Payoff Budget</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total monthly capital allocated across all minimums and rollover acceleration.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">Total / mo:</span>
            <input
              type="number"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(Number(e.target.value))}
              step={5000}
              min={2000}
              className="bg-input border border-border rounded-xl px-4 py-2.5 text-white font-orbitron font-bold text-lg focus:outline-none focus:border-primary w-44 text-right"
            />
          </div>
        </div>

        <button
          onClick={handleOptimize}
          disabled={isLoading}
          className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50"
        >
          {isLoading ? 'Calculating Rollover Timelines...' : 'Compare & Optimize Strategies'} {!isLoading && <ArrowRight size={18} />}
        </button>
        {error && <p className="text-destructive text-sm text-center font-medium bg-destructive/10 p-3 rounded-xl border border-destructive/20">{error}</p>}
      </div>

      {/* Results Workspace */}
      {currentResult && (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 flex flex-col gap-8 shadow-xl animate-fade-in-up">
          {/* Highlights Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <span className="text-xs uppercase font-medium text-muted-foreground">Active Strategy</span>
                <h3 className="text-2xl font-bold text-white capitalize">{currentResult.strategy.replace('_', ' ')} Plan</h3>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="bg-input/60 border border-border/80 px-4 py-2.5 rounded-2xl flex flex-col items-start">
                <span className="text-[10px] uppercase font-medium text-muted-foreground">Debt-Free In</span>
                <span className="font-orbitron font-bold text-xl text-white">
                  {currentResult.months_to_debt_free} <small className="text-xs font-normal text-zinc-400">mo</small>
                </span>
              </div>
              <div className="bg-input/60 border border-border/80 px-4 py-2.5 rounded-2xl flex flex-col items-start">
                <span className="text-[10px] uppercase font-medium text-muted-foreground">Total Interest</span>
                <span className="font-orbitron font-bold text-xl text-primary">
                  ₹{Number(currentResult.total_interest_paid).toLocaleString()}
                </span>
              </div>
              <div className="bg-input/60 border border-border/80 px-4 py-2.5 rounded-2xl flex flex-col items-start">
                <span className="text-[10px] uppercase font-medium text-muted-foreground">Final Score</span>
                <span className="font-orbitron font-bold text-xl text-emerald-400">
                  {currentResult.score_at_completion}/100
                </span>
              </div>
            </div>
          </div>

          {/* Payoff Order Sequence */}
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">Account Elimination Order</span>
            <div className="flex flex-wrap gap-2.5 items-center">
              {currentResult.payoff_order.map((accName, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="bg-input/70 border border-border px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold text-white">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-orbitron">{idx + 1}</span>
                    <span>{accName}</span>
                    <CheckCircle2 size={14} className="text-emerald-400 ml-1" />
                  </div>
                  {idx < currentResult.payoff_order.length - 1 && (
                    <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payoff Trajectory Chart */}
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">Balance Payoff Curve Over Time</span>
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={(currentResult.monthly_timeline || []).map((pt: any) => ({
                    ...pt,
                    month: Number(pt.month),
                    total_balance: Number(pt.total_balance),
                    total_interest_paid_to_date: Number(pt.total_interest_paid_to_date || 0),
                  }))}
                >
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickFormatter={(val) => `M${val}`}
                    minTickGap={25}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Total Debt']}
                    labelFormatter={(label) => `Month ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_balance"
                    stroke="#a855f7"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorBalance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
