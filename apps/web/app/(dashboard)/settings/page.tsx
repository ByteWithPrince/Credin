'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, RefreshCw, CheckCircle2, UserCheck, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { getPersonaState, getUserScore } from '@/lib/api';

const DEMO_PERSONAS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Rohit Sharma',
    age: 28,
    occupation: 'Software Engineer',
    tagline: '28 · Salaried Engineer · ₹72k/mo · Fair Health',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Priya Nair',
    age: 24,
    occupation: 'First Job, Thin File',
    tagline: '24 · First Job · ₹45k/mo · Thin Credit File',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Arjun Mehta',
    age: 35,
    occupation: 'Senior Tech Lead',
    tagline: '35 · Senior Tech Lead · ₹1.8L/mo · Strong Health',
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('00000000-0000-0000-0000-000000000001');
  const [personaData, setPersonaData] = useState<any>(null);
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
      setPersonaData(stateRes);
      setScoreData(scoreRes);
    } catch (err) {
      console.warn('Error loading settings persona:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedPersonaId);
  }, [selectedPersonaId]);

  const handleSelectPersona = (id: string) => {
    setSelectedPersonaId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('credin_persona', id);
    }
  };

  const handleResetSimulations = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('credin_last_simulation');
    }
    router.push('/what-if');
  };

  if (isLoading || !personaData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <p className="text-sm">Loading profile settings...</p>
      </div>
    );
  }

  const { state } = personaData;
  const overall = scoreData?.overall ?? 66;
  const band = scoreData?.band ?? 'Fair';

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 max-w-4xl mx-auto animate-fade-in-up">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <Shield size={14} /> Persona Profiles & Settings
        </div>
        <h1 className="font-orbitron font-bold text-3xl md:text-4xl text-white tracking-tight">Active Persona</h1>
        <p className="text-muted-foreground text-sm">
          CreditIn provides 3 canonical demo profiles for instant evaluation without authentication.
        </p>
      </header>

      {/* Switch Persona Cards */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Select Active Demo Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DEMO_PERSONAS.map((p) => {
            const isSelected = selectedPersonaId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPersona(p.id)}
                className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-primary/15 border-primary shadow-lg shadow-primary/20'
                    : 'bg-card border-border hover:border-zinc-500/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-orbitron font-bold text-white text-base">{p.name}</span>
                  {isSelected && (
                    <span className="text-[10px] font-semibold bg-primary text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={10} /> ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Financial State Summary */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 flex flex-col gap-8 shadow-xl">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center shrink-0">
            <User size={28} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white tracking-tight">{state.display_name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Seeded ground-truth profile · Baseline Score: <strong className="text-primary">{overall}/100 ({band})</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-input/50 border border-border/80 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[11px] uppercase font-medium tracking-wider text-muted-foreground">Monthly Income</span>
            <span className="text-lg font-semibold text-white font-orbitron">₹{Number(state.monthly_income).toLocaleString()}</span>
          </div>

          <div className="bg-input/50 border border-border/80 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[11px] uppercase font-medium tracking-wider text-muted-foreground">Fixed Rent</span>
            <span className="text-lg font-semibold text-white font-orbitron">₹{Number(state.rent || 0).toLocaleString()}</span>
          </div>

          <div className="bg-input/50 border border-border/80 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[11px] uppercase font-medium tracking-wider text-muted-foreground">Total Obligations</span>
            <span className="text-lg font-semibold text-white font-orbitron">₹{Number(state.total_obligations).toLocaleString()}</span>
          </div>

          <div className="bg-input/50 border border-border/80 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[11px] uppercase font-medium tracking-wider text-muted-foreground">Revolving Used</span>
            <span className="text-lg font-semibold text-white font-orbitron">₹{Number(state.revolving_used).toLocaleString()}</span>
          </div>

          <div className="bg-input/50 border border-border/80 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[11px] uppercase font-medium tracking-wider text-muted-foreground">Credit Limit</span>
            <span className="text-lg font-semibold text-white font-orbitron">₹{Number(state.revolving_limit).toLocaleString()}</span>
          </div>

          <div className="bg-input/50 border border-border/80 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[11px] uppercase font-medium tracking-wider text-muted-foreground">Emergency Fund</span>
            <span className="text-lg font-semibold text-white font-orbitron">₹{Number(state.emergency_fund).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
          <button
            onClick={handleResetSimulations}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow-md shadow-primary/20"
          >
            <Sparkles size={15} /> Launch What-If Simulator for {state.display_name.split(' ')[0]}
          </button>

          <button
            onClick={() => loadData(selectedPersonaId)}
            className="flex items-center gap-2 bg-input hover:bg-input/80 text-zinc-300 text-xs font-medium px-5 py-3 rounded-xl border border-border transition-all ml-auto"
          >
            <RefreshCw size={14} /> Refresh Profile State
          </button>
        </div>
      </div>
    </div>
  );
}
