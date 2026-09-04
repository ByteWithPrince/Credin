'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Send, RefreshCw, BarChart2, ShieldCheck, Zap, Activity, Menu, X, Sparkles, TrendingUp, Target } from 'lucide-react';
import { Persona, ScenarioResult } from '@/lib/types';
import { getPersonas, parseQuery, simulate, pingHealth } from '@/lib/api';
import { getCachedDemoResult } from '@/lib/demoCache';
import PersonaPicker from '@/components/PersonaPicker';
import ResultCard from '@/components/ResultCard';

const DEFAULT_PERSONAS: Persona[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    display_name: "Rohit Sharma",
    age: 28,
    occupation: "Salaried Software Engineer",
    tagline: "28 · Salaried Engineer · ₹72k/mo · Fair Health",
    overall_score: 66,
    band: "Fair",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    display_name: "Priya Nair",
    age: 24,
    occupation: "First Job, Thin File",
    tagline: "24 · First Job · ₹45k/mo · Thin Credit File",
    overall_score: 66,
    band: "Fair",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    display_name: "Arjun Mehta",
    age: 35,
    occupation: "Senior Tech Lead",
    tagline: "35 · Senior Tech Lead · ₹1.8L/mo · Strong Health",
    overall_score: 97,
    band: "Strong",
  },
];

export default function Home() {
  const [personas, setPersonas] = useState<Persona[]>(DEFAULT_PERSONAS);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("00000000-0000-0000-0000-000000000001");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<ScenarioResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('credin_persona', selectedPersonaId);
    }
  }, [selectedPersonaId]);

  useEffect(() => {
    // Warm up backend container
    pingHealth().catch(() => {});

    getPersonas()
      .then((res) => {
        if (res && res.length > 0) setPersonas(res);
      })
      .catch(() => {
        // Fallback to local default personas if API cold
      });
  }, []);

  const handleRunSimulation = async (textToSimulate: string) => {
    const text = textToSimulate.trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setError(null);
    setSimulationResult(null);

    try {
      // 1. Parse natural language query
      const intent = await parseQuery(selectedPersonaId, text);
      if (!intent) {
        // Check demo cache before throwing error
        const cached = getCachedDemoResult(selectedPersonaId, text);
        if (cached) {
          console.warn("Using seeded demo result cache for presentation reliability.");
          setSimulationResult(cached);
          setIsLoading(false);
          return;
        }
        setError("Could not parse a recognized financial scenario. Please try an example prompt below.");
        setIsLoading(false);
        return;
      }

      // 2. Build structured payload based on parsed intent
      let payload: any = {
        kind: intent.kind,
        user_id: selectedPersonaId,
      };

      if (intent.kind === "pay_debt") {
        payload.account_id = intent.account_id || "acc-rohit-hdfc";
        payload.amount = intent.amount ? String(intent.amount) : "50000.00";
        payload.from_savings = true;
      } else if (intent.kind === "close_card") {
        payload.account_id = intent.account_id || "acc-rohit-axis";
      } else if (intent.kind === "take_loan") {
        payload.principal = intent.principal ? String(intent.principal) : "800000.00";
        payload.annual_rate_pct = intent.annual_rate_pct ? String(intent.annual_rate_pct) : "9.2";
        payload.months = intent.months || 60;
        payload.kind_of_loan = intent.kind_of_loan || "secured_loan";
      }

      // 3. Execute scenario
      const result = await simulate(payload);
      setSimulationResult(result);
    } catch (err: any) {
      console.warn("Simulation API call failed. Checking demo cache...", err);
      const cached = getCachedDemoResult(selectedPersonaId, text);
      if (cached) {
        console.warn("Using seeded demo result cache for presentation reliability.");
        setSimulationResult(cached);
        setError(null);
      } else {
        setError(err.message || "Failed to execute simulation. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCounterProposal = (amountStr: string) => {
    const promptText = `What if I pay ₹${parseInt(amountStr, 10).toLocaleString()} toward my card?`;
    setQuery(promptText);
    handleRunSimulation(promptText);
  };

  const exampleChips = [
    { label: "Pay ₹50,000 to card", query: "What if I pay ₹50,000 toward my HDFC card?" },
    { label: "Close Axis Card", query: "Should I close my Axis card?" },
    { label: "Afford ₹8 Lakh Car Loan", query: "Can I afford a ₹8 lakh car loan?" },
    { label: "Take ₹3 Lakh Loan", query: "Can I take a ₹3 lakh personal loan?" },
  ];

  return (
    <div className="min-h-screen bg-black text-foreground relative overflow-hidden flex flex-col justify-between w-full">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-minimal mask-radial-faded pointer-events-none z-0" />

      {/* Semicircular Sunrise Curvature Arc */}
      <div className="absolute -bottom-16 sm:-bottom-8 md:bottom-0 left-1/2 -translate-x-1/2 w-full min-w-[100vw] pointer-events-none z-0 flex flex-col items-center justify-end overflow-visible">
        <svg 
          className="w-full h-[280px] sm:h-[380px] md:h-[480px] overflow-visible" 
          viewBox="0 0 1440 400" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="sunriseRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="0" />
              <stop offset="15%" stopColor="#9333ea" stopOpacity="0.3" />
              <stop offset="35%" stopColor="#c084fc" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#f5f3ff" stopOpacity="0.95" />
              <stop offset="65%" stopColor="#c084fc" stopOpacity="0.75" />
              <stop offset="85%" stopColor="#9333ea" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#9333ea" stopOpacity="0" />
            </linearGradient>

            <radialGradient id="sunriseCoreGlow" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.48" />
              <stop offset="30%" stopColor="#9333ea" stopOpacity="0.28" />
              <stop offset="65%" stopColor="#581c87" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            <filter id="softAtmosphericBlur" x="-30%" y="-60%" width="160%" height="240%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
              </feMerge>
            </filter>

            <filter id="wideCoronaBlur" x="-30%" y="-70%" width="160%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="50" />
            </filter>
          </defs>

          <ellipse cx="720" cy="140" rx="720" ry="240" fill="url(#sunriseCoreGlow)" />
          <path 
            d="M -150,420 Q 720,60 1590,420" 
            stroke="url(#sunriseRimGrad)" 
            strokeWidth="48" 
            strokeLinecap="round" 
            filter="url(#wideCoronaBlur)" 
            opacity="0.7" 
          />
          <path 
            d="M -150,420 Q 720,60 1590,420" 
            stroke="url(#sunriseRimGrad)" 
            strokeWidth="12" 
            strokeLinecap="round" 
            filter="url(#softAtmosphericBlur)" 
            opacity="0.85" 
          />
        </svg>
      </div>

      {/* Atmospheric Ambient Glow behind Hero */}
      <div 
        className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[850px] sm:w-[1200px] h-[380px] pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 65% 45% at 50% 30%, rgba(147, 51, 234, 0.24) 0%, rgba(126, 34, 206, 0.08) 50%, transparent 85%)",
          filter: "blur(65px)",
        }}
      />

      {/* Header */}
      <header className="w-full px-4 sm:px-8 md:px-12 py-5 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-orbitron font-bold text-2xl tracking-wider text-white">
            CredIn
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-zinc-400">
            <Link href="/" className="text-white hover:text-primary transition-colors">
              Simulator
            </Link>
            <Link href={`/score?user=${selectedPersonaId}`} className="hover:text-white transition-colors">
              Health Score
            </Link>
            <Link href={`/accounts?user=${selectedPersonaId}`} className="hover:text-white transition-colors">
              Debt Optimizer
            </Link>
            <Link href="/overview" className="hover:text-white transition-colors">
              Overview
            </Link>
            <Link href="/improvement" className="hover:text-white transition-colors">
              Action Plan
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href={`/score?user=${selectedPersonaId}`} 
            className="text-xs sm:text-sm font-medium text-zinc-200 liquid-glass-btn px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:text-white flex items-center gap-2"
          >
            <Activity size={16} className="text-primary" /> 
            <span>Health Score</span>
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white"
            aria-label="Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden relative z-30 mx-4 mb-4 p-4 rounded-2xl bg-zinc-950/90 backdrop-blur-2xl border border-white/10 flex flex-col gap-2 animate-fade-in-up">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-white/10 flex items-center gap-2.5"
          >
            <Sparkles size={16} className="text-primary" /> What-If Simulator
          </Link>
          <Link
            href={`/score?user=${selectedPersonaId}`}
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-white/10 flex items-center gap-2.5"
          >
            <Activity size={16} className="text-primary" /> Financial Health Score
          </Link>
          <Link
            href={`/accounts?user=${selectedPersonaId}`}
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-white/10 flex items-center gap-2.5"
          >
            <TrendingUp size={16} className="text-primary" /> Debt Payoff Optimizer
          </Link>
          <Link
            href="/overview"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-white/10 flex items-center gap-2.5"
          >
            <ShieldCheck size={16} className="text-primary" /> Dashboard Overview
          </Link>
          <Link
            href="/improvement"
            onClick={() => setMobileMenuOpen(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-white/10 flex items-center gap-2.5"
          >
            <Target size={16} className="text-primary" /> Credit Action Plan
          </Link>
        </div>
      )}


      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center pt-8 pb-24 relative z-10 gap-10">
        {/* Hero Title */}
        <div className="flex flex-col items-center text-center max-w-4xl animate-fade-in-up">
          <h1 className="font-orbitron font-bold text-3xl sm:text-5xl md:text-6xl leading-[1.15] md:leading-[1.1] tracking-tight text-white mb-4">
            Your credit score tells you what happened.<br />
            <span className="text-primary drop-shadow-[0_0_25px_rgba(147,51,234,0.35)]">
              CredIn tells you what happens next.
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl leading-relaxed font-normal">
            A financial &quot;What-If&quot; engine that calculates score and cash-flow impact <strong className="text-zinc-200 font-semibold">before</strong> you act.
          </p>
        </div>

        {/* Step 1: Demo Personas */}
        <div className="w-full animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <PersonaPicker
            personas={personas}
            selectedId={selectedPersonaId}
            onSelect={(id) => {
              setSelectedPersonaId(id);
              setSimulationResult(null);
            }}
            isLoading={isLoading}
          />
        </div>

        {/* Step 2: What-If Interactive Box */}
        <div className="w-full liquid-glass rounded-3xl p-6 sm:p-8 flex flex-col gap-6 animate-fade-in-up border border-white/10" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Step 2 · Ask a What-If Question
              </h2>
              <p className="text-xs text-zinc-400">Describe any debt, loan, or card action in plain English</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunSimulation(query);
            }}
            className="flex flex-col sm:flex-row gap-3 w-full"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What if I pay ₹50,000 toward my card?"
                aria-label="What-if financial question"
                disabled={isLoading}
                className="w-full bg-input/80 border border-border/80 rounded-2xl px-5 py-4 text-sm sm:text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="liquid-glass-btn bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Simulating...
                </>
              ) : (
                <>
                  Simulate <Send size={18} />
                </>
              )}
            </button>
          </form>

          {/* Example Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Examples:</span>
            {exampleChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(chip.query);
                  handleRunSimulation(chip.query);
                }}
                disabled={isLoading}
                className="liquid-glass-btn px-3.5 py-1.5 rounded-full text-xs text-zinc-300 hover:text-white transition-all hover:border-primary/50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-red-400 text-xs sm:text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Step 3: Simulation Results Card */}
        {simulationResult && (
          <div className="w-full">
            <ResultCard
              result={simulationResult}
              onCounterProposal={handleCounterProposal}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Feature Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-12 w-full animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="liquid-glass rounded-3xl p-8 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-1">
              <Zap size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white tracking-tight">Deterministic Engine</h3>
            <p className="text-zinc-400 leading-relaxed text-xs sm:text-sm">
              All financial arithmetic is calculated in pure Python with Decimal precision. The LLM only parses and explains.
            </p>
          </div>

          <div className="liquid-glass rounded-3xl p-8 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-1">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white tracking-tight">Emergency Guard-Rails</h3>
            <p className="text-zinc-400 leading-relaxed text-xs sm:text-sm">
              Protects you from draining your savings runway. Computes mathematical counter-proposals to keep you safe.
            </p>
          </div>

          <div className="liquid-glass rounded-3xl p-8 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-1">
              <BarChart2 size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white tracking-tight">Payoff Optimization</h3>
            <p className="text-zinc-400 leading-relaxed text-xs sm:text-sm">
              Compares Avalanche, Snowball, and Credit-Optimized rollover schedules with zero manual calculations.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
