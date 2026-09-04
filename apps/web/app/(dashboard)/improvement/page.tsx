'use client';

import { useEffect, useState } from 'react';
import { Target, AlertTriangle, CheckCircle2, ChevronRight, UserCheck, RefreshCw, Sparkles } from 'lucide-react';
import { getImprovementPlan } from '@/lib/api';

const DEMO_PERSONAS = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Rohit Sharma', label: 'Rohit (Fair, Overleveraged)' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Priya Nair', label: 'Priya (Fair, Thin File)' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Arjun Mehta', label: 'Arjun (Strong, Prime)' },
];

export default function ImprovementPage() {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('00000000-0000-0000-0000-000000000001');
  const [plan, setPlan] = useState<any>(null);
  const [completedMilestones, setCompletedMilestones] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPersona = localStorage.getItem('credin_persona');
      if (savedPersona) {
        setSelectedPersonaId(savedPersona);
      }
    }
  }, []);

  const loadPlan = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getImprovementPlan(userId);
      setPlan(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load action plan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlan(selectedPersonaId);
  }, [selectedPersonaId]);

  const toggleMilestone = (monthNumber: number) => {
    setCompletedMilestones((prev) => ({
      ...prev,
      [monthNumber]: !prev[monthNumber],
    }));
  };

  const handlePersonaChange = (id: string) => {
    setSelectedPersonaId(id);
    setCompletedMilestones({});
    if (typeof window !== 'undefined') {
      localStorage.setItem('credin_persona', id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-muted-foreground text-sm">Analyzing profile weaknesses & generating custom action plan...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-center text-destructive">
          <AlertTriangle size={32} />
          <p className="font-medium">{error || 'Could not load plan'}</p>
          <button
            onClick={() => loadPlan(selectedPersonaId)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const completedCount = Object.values(completedMilestones).filter(Boolean).length;
  const totalMilestones = plan.milestones?.length || 1;
  const progressPct = Math.round((completedCount / totalMilestones) * 100);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto flex flex-col gap-8 animate-fade-in-up">
      {/* Header */}
      <header className="flex flex-col gap-2 pt-2">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <Sparkles size={14} /> Milestone-Based Improvement Roadmap
        </div>
        <h1 className="font-orbitron font-bold text-3xl md:text-4xl text-white tracking-tight">Credit Health Action Plan</h1>
        <p className="text-muted-foreground text-sm">
          A personalized sequential roadmap that targets your profile's highest-impact weaknesses first.
        </p>
      </header>

      {/* Persona Switcher */}
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
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Score Projection Card */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center gap-6 justify-between animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Target size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Projected Score Elevation</h3>
            <p className="text-xs text-muted-foreground">
              Completing these milestones moves your standing from{' '}
              <span className="text-zinc-200 font-semibold">{plan.current_score} ({plan.band || 'Fair'})</span> to{' '}
              <span className="text-primary font-semibold">{plan.target_score}</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-input/40 border border-border px-6 py-4 rounded-2xl">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Current</span>
            <span className="font-orbitron text-2xl font-bold text-white">{plan.current_score}</span>
          </div>
          <ChevronRight size={20} className="text-muted-foreground/50" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Target</span>
            <span className="font-orbitron text-2xl font-bold text-emerald-400">{plan.target_score}</span>
          </div>
        </div>
      </div>

      {/* Key Focus Areas */}
      <div className="flex flex-col gap-3 animate-fade-in-up">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Identified Weaknesses & Focus Areas</h2>
        <div className="flex flex-wrap gap-2.5">
          {plan.weaknesses?.map((w: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-300 px-3.5 py-1.5 rounded-full text-xs font-medium">
              <AlertTriangle size={13} />
              {w}
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-card border border-border p-4 rounded-2xl flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Action Roadmap Progress</span>
          <span className="font-orbitron font-semibold text-primary">{completedCount} of {totalMilestones} Milestones ({progressPct}%)</span>
        </div>
        <div className="w-full h-2 bg-input rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-purple-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Monthly Roadmap Timeline */}
      <div className="flex flex-col gap-6 mt-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sequential Milestones</h2>
        <div className="flex flex-col gap-5">
          {plan.milestones?.map((milestone: any, index: number) => {
            const isCompleted = !!completedMilestones[milestone.month_number];
            return (
              <div
                key={index}
                className={`bg-card border rounded-3xl p-6 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-orbitron font-bold text-sm shrink-0 mt-0.5 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-primary/20 text-primary border border-primary/30'
                    }`}
                  >
                    M{milestone.month_number}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base font-semibold ${isCompleted ? 'line-through text-zinc-400' : 'text-white'}`}>
                        {milestone.title}
                      </h3>
                      {isCompleted && (
                        <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                      {milestone.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleMilestone(milestone.month_number)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-input hover:bg-primary/20 text-zinc-300 hover:text-white border border-border'
                  }`}
                >
                  <CheckCircle2 size={15} className={isCompleted ? 'text-emerald-400' : 'text-zinc-500'} />
                  <span>{isCompleted ? 'Mark Pending' : 'Mark as Done'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
