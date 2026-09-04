'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/overview');
      }

    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12">
      <div className="font-orbitron font-bold text-3xl tracking-wider text-white mb-8">CredIn</div>
      
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-2xl animate-fade-in-up flex flex-col gap-6">
        <div>
          <h1 className="font-orbitron font-semibold text-2xl text-white tracking-tight">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp ? 'Start simulating your financial future today.' : 'Sign in to access your financial what-if engine.'}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-primary/10 border border-primary/20 text-primary text-sm p-4 rounded-xl">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="email" 
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-all"
                required
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2" 
            disabled={isLoading || !email || !password}
          >
            {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Or Select Demo Persona</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {[
              { id: '00000000-0000-0000-0000-000000000001', name: 'Rohit Sharma', role: 'Salaried Software Engineer', score: '66 Fair', border: 'hover:border-amber-500/50' },
              { id: '00000000-0000-0000-0000-000000000002', name: 'Priya Nair', role: 'First Job · Thin Credit File', score: '66 Fair', border: 'hover:border-amber-500/50' },
              { id: '00000000-0000-0000-0000-000000000003', name: 'Arjun Mehta', role: 'Senior Tech Lead · Multiple Loans', score: '97 Strong', border: 'hover:border-emerald-500/50' },
            ].map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('creditin_persona_id', persona.id);
                    localStorage.setItem('creditin_demo_persona', persona.id);
                  }
                  router.push('/overview');
                }}
                className={`w-full bg-input/70 hover:bg-input text-left p-3 rounded-2xl border border-border flex items-center justify-between transition-all group ${persona.border}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary text-xs group-hover:bg-primary group-hover:text-white transition-all">
                    {persona.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white leading-tight">{persona.name}</div>
                    <div className="text-[10px] text-zinc-400 leading-tight">{persona.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-input border border-border text-zinc-300">
                    {persona.score}
                  </span>
                  <ArrowRight size={14} className="text-zinc-500 group-hover:text-primary transition-all group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground border-t border-border pt-4">
          <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
          <button 
            type="button" 
            className="text-primary hover:underline font-semibold"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
