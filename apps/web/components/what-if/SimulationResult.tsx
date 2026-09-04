'use client';

import { Activity, TrendingUp, TrendingDown, Info } from 'lucide-react';

interface Props {

  result: any;
}

export default function SimulationResult({ result }: Props) {
  if (result.error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-3xl p-6">
        <p className="text-sm">{String(result.error)}</p>
      </div>
    );
  }

  const { delta_score, insight, new_metrics, new_emi } = result;
  
  const isPositive = delta_score >= 0;
  const newScore = new_metrics?.overall_health_score || 0;
  
  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-xl animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
          <Activity size={20} />
        </div>
        <h3 className="text-xl font-semibold text-white tracking-tight">Simulation Result</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-input/50 border border-border rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">New Health Score</span>
          <div className="flex items-baseline gap-3">
            <span className="font-orbitron font-bold text-3xl sm:text-4xl text-white">{newScore}</span>
            <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
              isPositive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-destructive/15 text-destructive border border-destructive/30'
            }`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(delta_score)} pts</span>
            </div>
          </div>
        </div>
        
        {new_emi !== undefined && (
          <div className="bg-input/50 border border-border rounded-2xl p-5 flex flex-col gap-2">
             <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">New Monthly EMI</span>
             <span className="font-orbitron font-bold text-3xl sm:text-4xl text-white">₹{new_emi.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 p-4 rounded-2xl">
        <Info size={18} className="text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-zinc-300 leading-relaxed">{insight}</p>
      </div>
    </div>
  );
}
