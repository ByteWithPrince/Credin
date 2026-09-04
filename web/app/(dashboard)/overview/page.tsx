'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Wallet, Landmark, ShieldAlert, ArrowRight, UserCheck, Sparkles, TrendingUp, Activity } from 'lucide-react';
import { getPersonaState, getUserScore } from '@/lib/api';

const DEMO_PERSONAS = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Rohit Sharma', tagline: '28 · ₹72k/mo · Fair Health' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Priya Nair', tagline: '24 · ₹45k/mo · Thin File' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Arjun Mehta', tagline: '35 · ₹1.8L/mo · Prime Profile' },
];

export default function OverviewPage() {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('00000000-0000-0000-0000-000000000001');
  const [data, setData] = useState<any>(null);
  const [scoreData, setScoreData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('credin_persona');
      if (saved) setSelectedPersonaId(saved);
    }
  }, []);

  const loadData = async (userId: string) => {
    setIsLoading(true);
    try {
      const [stateRes, scoreRes] = await Promise.all([
        getPersonaState(userId).catch(() => null),
        getUserScore(userId).catch(() => null),
      ]);
      setData(stateRes);
      setScoreData(scoreRes);
    } catch (err) {
      console.warn('Error loading overview data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedPersonaId);
  }, [selectedPersonaId]);

  const handlePersonaChange = (id: string) => {
    setSelectedPersonaId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('credin_persona', id);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-400 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <p className="text-sm">Calculating real-time financial health profile...</p>
      </div>
    );
  }

  const { state } = data;
  const overall = scoreData?.overall ?? 66;
  const band = scoreData?.band ?? 'Fair';

  // SVG Gauge calculations
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overall / 100) * (circumference / 2);

  let scoreColor = '#f87171'; // Red
  if (overall >= 85) scoreColor = '#22c55e'; // Green
  else if (overall >= 70) scoreColor = '#34d399'; // Emerald
  else if (overall >= 55) scoreColor = '#fbbf24'; // Amber
  else if (overall >= 40) scoreColor = '#fb923c'; // Orange

  const revolvingUsed = Number(state.revolving_used || 0);
  const revolvingLimit = Number(state.revolving_limit || 1);
  const emergencyFund = Number(state.emergency_fund || 0);
  const monthlyIncome = Number(state.monthly_income || 0);
  const obligations = Number(state.total_obligations || 0);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto flex flex-col gap-8 animate-fade-in-up">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
        <div>
          <h1 className="font-orbitron font-bold text-3xl md:text-4xl text-white tracking-tight">
            Financial Health Overview
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Active persona: <strong className="text-white font-semibold">{state.display_name}</strong>
          </p>
        </div>

        <Link
          href={`/what-if`}
          className="liquid-glass-btn px-5 py-2.5 rounded-full text-xs font-semibold text-white flex items-center gap-2"
        >
          <Sparkles size={15} className="text-primary" /> Simulate Scenarios <ArrowRight size={14} />
        </Link>
      </header>

      {/* Persona Quick-Switch */}
      <div className="bg-card border border-border rounded-2xl p-3 flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase font-medium text-muted-foreground px-3 flex items-center gap-1.5">
          <UserCheck size={14} className="text-primary" /> Active Profile:
        </span>
        <div className="flex flex-wrap gap-2">
          {DEMO_PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePersonaChange(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                selectedPersonaId === p.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-input/60 text-zinc-400 hover:text-white border border-border'
              }`}
            >
              {p.name} ({p.tagline.split('·')[2]?.trim() || 'Profile'})
            </button>
          ))}
        </div>
      </div>

      {/* Primary Health Score Hero Card */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center gap-8 animate-fade-in-up">
        <div className="relative flex flex-col items-center justify-center shrink-0">
          <svg className="w-[220px] h-[130px]" viewBox="0 0 200 120">
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="16"
              strokeDasharray={`${circumference / 2} ${circumference}`}
              strokeDashoffset={circumference}
              transform="rotate(180 100 100)"
              strokeLinecap="round"
            />
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="16"
              strokeDasharray={`${circumference / 2} ${circumference}`}
              strokeDashoffset={offset}
              transform="rotate(180 100 100)"
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div className="absolute bottom-2 flex flex-col items-center">
            <span className="font-orbitron text-4xl font-bold text-white leading-none">{overall}</span>
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider mt-1">{band}</span>
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-3 w-full">
          <div className="flex justify-between items-center p-3.5 bg-input/40 rounded-xl border border-border">
            <div className="flex items-center gap-2.5">
              <CreditCard size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Revolving Utilization</span>
            </div>
            <strong className="text-white font-orbitron text-sm">
              {((revolvingUsed / (revolvingLimit || 1)) * 100).toFixed(1)}%
            </strong>
          </div>

          <div className="flex justify-between items-center p-3.5 bg-input/40 rounded-xl border border-border">
            <div className="flex items-center gap-2.5">
              <TrendingUp size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Debt Load (FOIR)</span>
            </div>
            <strong className="text-white font-orbitron text-sm">
              {((obligations / (monthlyIncome || 1)) * 100).toFixed(1)}%
            </strong>
          </div>

          <div className="flex justify-between items-center p-3.5 bg-input/40 rounded-xl border border-border">
            <div className="flex items-center gap-2.5">
              <Landmark size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Emergency Runway</span>
            </div>
            <strong className="text-white font-orbitron text-sm">
              {(emergencyFund / (obligations || 1)).toFixed(1)} months
            </strong>
          </div>
        </div>
      </div>

      {/* Financial Capital Snapshot */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Balances & Capital Position</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard size={16} className="text-primary" />
            <span className="text-xs font-medium">Revolving Balance</span>
          </div>
          <div className="text-xl font-bold text-white font-orbitron">₹{revolvingUsed.toLocaleString()}</div>
          <span className="text-[10px] text-zinc-500">Across active credit cards</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet size={16} className="text-primary" />
            <span className="text-xs font-medium">Available Credit</span>
          </div>
          <div className="text-xl font-bold text-white font-orbitron">₹{Math.max(0, revolvingLimit - revolvingUsed).toLocaleString()}</div>
          <span className="text-[10px] text-zinc-500">Total limit: ₹{revolvingLimit.toLocaleString()}</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Landmark size={16} className="text-primary" />
            <span className="text-xs font-medium">Emergency Fund</span>
          </div>
          <div className="text-xl font-bold text-white font-orbitron">₹{emergencyFund.toLocaleString()}</div>
          <span className="text-[10px] text-zinc-500">Liquid reserves</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp size={16} className="text-primary" />
            <span className="text-xs font-medium">Monthly Obligations</span>
          </div>
          <div className="text-xl font-bold text-white font-orbitron">₹{obligations.toLocaleString()}</div>
          <span className="text-[10px] text-zinc-500">Income: ₹{monthlyIncome.toLocaleString()}/mo</span>
        </div>
      </div>

      {/* Account Portfolio List */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Credit Portfolio ({state.accounts?.length || 0} Accounts)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {state.accounts?.map((acc: any) => (
            <div key={acc.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between gap-3 hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-white text-sm">{acc.display_name}</h4>
                  <span className="text-[11px] text-muted-foreground uppercase">{acc.issuer} · {acc.kind.replace('_', ' ')}</span>
                </div>
                {acc.is_revolving && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Card
                  </span>
                )}
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-border/60">
                <div>
                  <span className="text-[10px] text-muted-foreground">Balance</span>
                  <p className="font-orbitron font-bold text-sm text-white">₹{Number(acc.balance).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground">Interest Rate</span>
                  <p className="font-orbitron font-medium text-xs text-primary">{Number(acc.interest_rate)}% APR</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link
          href="/what-if"
          className="bg-card border border-border hover:border-primary/60 p-5 rounded-2xl flex flex-col gap-2 transition-all hover:bg-input/40 group"
        >
          <div className="flex items-center justify-between text-white font-semibold text-sm">
            <span>What-If Simulator</span>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Test "what-if" impacts before paying debt, taking a loan, or closing a card.
          </p>
        </Link>

        <Link
          href={`/score?user=${selectedPersonaId}`}
          className="bg-card border border-border hover:border-primary/60 p-5 rounded-2xl flex flex-col gap-2 transition-all hover:bg-input/40 group"
        >
          <div className="flex items-center justify-between text-white font-semibold text-sm">
            <span>Full Score Breakdown</span>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Examine all 6 components, bureau weights, and plain-English readings.
          </p>
        </Link>

        <Link
          href="/optimizer"
          className="bg-card border border-border hover:border-primary/60 p-5 rounded-2xl flex flex-col gap-2 transition-all hover:bg-input/40 group"
        >
          <div className="flex items-center justify-between text-white font-semibold text-sm">
            <span>Debt Payoff Optimizer</span>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Compare Avalanche vs Snowball with interactive month-by-month charts.
          </p>
        </Link>
      </div>
    </div>
  );
}
