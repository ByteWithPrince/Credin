'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    monthly_income: '',
    total_available_credit: '',
    total_used_credit: '',
    monthly_obligations: '',
    emergency_fund: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Allow numbers only
    if (value === '' || /^\d+$/.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNext = () => setStep(s => Math.min(3, s + 1));
  const handleBack = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = async () => {
    setIsLoading(true);
    // 1. Calculate health score via API
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If not logged in, redirect to login first
        router.push('/login');
        return;
      }

      const payload = {
        monthly_income: parseFloat(formData.monthly_income || '0'),
        total_available_credit: parseFloat(formData.total_available_credit || '0'),
        total_used_credit: parseFloat(formData.total_used_credit || '0'),
        monthly_obligations: parseFloat(formData.monthly_obligations || '0'),
        emergency_fund: parseFloat(formData.emergency_fund || '0')
      };

      const res = await fetch('http://localhost:8000/health/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const scoreData = await res.json();

      // 2. Save profile and score to Supabase
      const fullProfile = {
        user_id: user.id,
        ...payload,
        ...scoreData
      };
      
      const { error } = await supabase
        .from('financial_profiles')
        .upsert(fullProfile, { onConflict: 'user_id' });

      if (error) throw error;
      
      // Keep in local storage as a fallback/cache for fast rendering
      localStorage.setItem('credin_profile', JSON.stringify(fullProfile));
      
      // 3. Redirect to dashboard
      router.push('/overview');
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg mb-8 flex justify-between items-center">
        <div className="font-orbitron font-bold text-2xl tracking-wider text-white">CredIn</div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                step === s
                  ? 'bg-primary text-white scale-110 shadow-[0_0_15px_rgba(147,51,234,0.5)]'
                  : step > s
                  ? 'bg-primary/30 text-primary border border-primary/40'
                  : 'bg-card text-muted-foreground border border-border'
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-8 shadow-2xl animate-fade-in-up">
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">Let&apos;s understand your cash flow</h2>
              <p className="text-sm text-muted-foreground mt-1">This helps us calculate your Debt-to-Income ratio accurately.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Take-Home Income (₹)</label>
              <input
                type="text"
                name="monthly_income"
                placeholder="e.g. 60000"
                className="bg-input border border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary text-base transition-all"
                value={formData.monthly_income}
                onChange={handleChange}
                autoFocus
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fixed Monthly Obligations (₹)</label>
              <span className="text-xs text-muted-foreground">Rent, EMIs, minimum card payments</span>
              <input
                type="text"
                name="monthly_obligations"
                placeholder="e.g. 25000"
                className="bg-input border border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary text-base transition-all"
                value={formData.monthly_obligations}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">Now, your credit profile</h2>
              <p className="text-sm text-muted-foreground mt-1">This powers our utilization and simulation engine.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Combined Credit Limit (₹)</label>
              <span className="text-xs text-muted-foreground">Sum of all your credit card limits</span>
              <input
                type="text"
                name="total_available_credit"
                placeholder="e.g. 200000"
                className="bg-input border border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary text-base transition-all"
                value={formData.total_available_credit}
                onChange={handleChange}
                autoFocus
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Current Balances (₹)</label>
              <span className="text-xs text-muted-foreground">How much you currently owe across all cards</span>
              <input
                type="text"
                name="total_used_credit"
                placeholder="e.g. 45000"
                className="bg-input border border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary text-base transition-all"
                value={formData.total_used_credit}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-tight">Finally, your safety net</h2>
              <p className="text-sm text-muted-foreground mt-1">We use this to make safer recommendations for you.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Emergency Savings (₹)</label>
              <span className="text-xs text-muted-foreground">Liquid cash in savings accounts or FDs</span>
              <input
                type="text"
                name="emergency_fund"
                placeholder="e.g. 150000"
                className="bg-input border border-border rounded-xl px-4 py-3 text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary text-base transition-all"
                value={formData.emergency_fund}
                onChange={handleChange}
                autoFocus
              />
            </div>

            <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 p-4 rounded-2xl">
              <CheckCircle2 className="text-primary shrink-0" size={24} />
              <div>
                <h3 className="text-sm font-semibold text-white">You&apos;re all set!</h3>
                <p className="text-xs text-muted-foreground">We&apos;re ready to compute your Financial Health Score.</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
          {step > 1 ? (
            <button 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white px-4 py-2.5 rounded-xl border border-border hover:border-muted-foreground transition-all" 
              onClick={handleBack}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}
          
          {step < 3 ? (
            <button 
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed" 
              onClick={handleNext}
              disabled={(step === 1 && (!formData.monthly_income || !formData.monthly_obligations)) || 
                        (step === 2 && (!formData.total_available_credit || !formData.total_used_credit))}
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button 
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] disabled:opacity-40 disabled:cursor-not-allowed" 
              onClick={handleSubmit}
              disabled={!formData.emergency_fund || isLoading}
            >
              {isLoading ? 'Calculating...' : 'See My Score'} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
