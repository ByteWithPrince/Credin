'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Lightbulb, TrendingUp, Activity, Target, User, Menu, X, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_PERSONAS } from '@/lib/api';

export default function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const [currentPersonaId, setCurrentPersonaId] = useState<string>('00000000-0000-0000-0000-000000000001');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('creditin_persona_id') || localStorage.getItem('creditin_demo_persona');
      if (saved) {
        setCurrentPersonaId(saved);
      }
    }
  }, []);

  const handleSelectPersona = (personaId: string) => {
    setCurrentPersonaId(personaId);
    setPersonaDropdownOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('creditin_persona_id', personaId);
      localStorage.setItem('creditin_demo_persona', personaId);
      window.dispatchEvent(new CustomEvent('personaChanged', { detail: personaId }));
      // Quick refresh to re-fetch persona-scoped data across active dashboard views
      window.location.reload();
    }
  };

  const activePersona = DEFAULT_PERSONAS.find((p) => p.id === currentPersonaId) || DEFAULT_PERSONAS[0];

  const navItems = [
    { name: 'Overview', path: '/overview', icon: Home },
    { name: 'What-If Engine', path: '/what-if', icon: Lightbulb },
    { name: 'Health Score', path: '/score', icon: Activity },
    { name: 'Debt Optimizer', path: '/optimizer', icon: TrendingUp },
    { name: 'Action Plan', path: '/improvement', icon: Target },
    { name: 'Profile', path: '/settings', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="font-orbitron font-bold text-xl tracking-wider text-white flex items-center gap-2">
            CredIn
            <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
              SIMULATOR
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2',
                    isActive
                      ? 'bg-primary/20 text-white font-semibold border border-primary/30 shadow-sm shadow-primary/20'
                      : 'text-zinc-400 hover:text-white hover:bg-input/50'
                  )}
                >
                  <Icon size={15} className={isActive ? 'text-primary' : 'text-zinc-400'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Area: Persona Switcher & CTA */}
        <div className="flex items-center gap-3">
          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-input/70 hover:bg-input border border-border/80 hover:border-primary/50 text-xs text-white transition-all shadow-sm"
              title="Switch Active Persona"
            >
              <div className="w-6 h-6 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs">
                {activePersona.display_name.charAt(0)}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-medium text-white leading-tight">{activePersona.display_name}</span>
                <span className="text-[10px] text-zinc-400 leading-tight">Score: {activePersona.overall_score} · {activePersona.band}</span>
              </div>
              <ChevronDown size={14} className={cn("text-zinc-400 transition-transform", personaDropdownOpen && "rotate-180")} />
            </button>

            {personaDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-2 shadow-2xl z-50 animate-fade-in-up">
                <div className="px-3 py-2 border-b border-border/60 mb-1.5">
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Switch Demo Persona</p>
                  <p className="text-[10px] text-zinc-500">Live PostgreSQL Data from Supabase</p>
                </div>
                <div className="space-y-1">
                  {DEFAULT_PERSONAS.map((p) => {
                    const isSelected = p.id === currentPersonaId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPersona(p.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all text-xs",
                          isSelected
                            ? "bg-primary/20 border border-primary/40 text-white font-medium shadow-sm"
                            : "hover:bg-input/70 text-zinc-300 hover:text-white"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs",
                            isSelected ? "bg-primary text-white" : "bg-input border border-border text-zinc-300"
                          )}>
                            {p.display_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{p.display_name}</div>
                            <div className="text-[10px] text-zinc-400 truncate max-w-[150px]">{p.tagline}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                            p.overall_score >= 85
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}>
                            {p.overall_score}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/"
            className="hidden sm:flex liquid-glass-btn px-4 py-2 rounded-full text-xs font-semibold text-white items-center gap-2"
          >
            <Sparkles size={14} className="text-primary" /> Ask What-If
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-input text-zinc-300 hover:text-white border border-border"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-2xl px-4 py-4 flex flex-col gap-2 animate-fade-in-up">
          {/* Mobile Persona Switcher */}
          <div className="p-3 bg-card rounded-2xl border border-border mb-2">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">Active Demo Persona</p>
            <div className="grid grid-cols-3 gap-1.5">
              {DEFAULT_PERSONAS.map((p) => {
                const isSelected = p.id === currentPersonaId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      handleSelectPersona(p.id);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all",
                      isSelected
                        ? "bg-primary text-white font-bold border border-primary/40 shadow-sm"
                        : "bg-input/60 hover:bg-input text-zinc-300 border border-border/60 text-xs"
                    )}
                  >
                    <span className="text-xs font-semibold leading-tight">{p.display_name.split(' ')[0]}</span>
                    <span className="text-[10px] opacity-80">{p.overall_score} {p.band}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3',
                  isActive
                    ? 'bg-primary/20 text-white font-semibold border border-primary/30'
                    : 'text-zinc-300 hover:text-white hover:bg-input/60'
                )}
              >
                <Icon size={18} className={isActive ? 'text-primary' : 'text-zinc-400'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-2 text-center py-3 bg-primary text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Sparkles size={14} /> Open Natural Language Simulator
          </Link>
        </div>
      )}
    </header>
  );
}
