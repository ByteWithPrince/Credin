'use client';

import React, { useState } from 'react';
import { ArrowRight, AlertTriangle, ShieldCheck, XCircle, CheckCircle2, RefreshCw, FileText } from 'lucide-react';
import { ScenarioResult } from '@/lib/types';
import ReportModal from './ReportModal';

interface Props {
  result: ScenarioResult;
  onCounterProposal?: (amount: string) => void;
  isLoading?: boolean;
}

export default function ResultCard({ result, onCounterProposal, isLoading }: Props) {
  const [showReport, setShowReport] = useState(false);
  const delta = result.score_after - result.score_before;
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  // Filter components that moved
  const movedComponents = result.component_deltas.filter((c) => {
    const d = typeof c.delta === 'string' ? parseFloat(c.delta) : c.delta;
    return Math.abs(d) >= 0.1;
  });

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Simulation Verdict and Impact"
      className="liquid-glass rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl animate-fade-in-up w-full border border-white/10"
    >
      {/* 1. Verdict Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          {result.verdict === 'good' && (
            <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={22} />
            </div>
          )}
          {result.verdict === 'caution' && (
            <div className="w-10 h-10 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
          )}
          {result.verdict === 'bad' && (
            <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center">
              <XCircle size={22} />
            </div>
          )}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Simulation Verdict
            </div>
            <h3 className="text-xl font-bold capitalize text-white">
              {result.verdict === 'good' && 'Proceed with Confidence'}
              {result.verdict === 'caution' && 'Caution Advised (Guard-Rail Triggered)'}
              {result.verdict === 'bad' && 'High Risk (Not Recommended)'}
            </h3>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs uppercase font-medium text-muted-foreground block">Resulting Band</span>
          <span className="font-semibold text-primary">{result.band_after}</span>
        </div>
      </div>

      {/* 2. Score Move Side-by-Side */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">
              Current Score
            </span>
            <span className="font-orbitron font-bold text-4xl text-zinc-400">
              {result.score_before}
            </span>
          </div>

          <ArrowRight className="text-muted-foreground" size={24} />

          <div className="flex flex-col items-center sm:items-start">
            <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground mb-1">
              Projected Score
            </span>
            <span className="font-orbitron font-bold text-4xl text-white">
              {result.score_after}
            </span>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm border ${
            isPositive
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
              : isNeutral
              ? 'bg-zinc-900 text-zinc-300 border-zinc-700'
              : 'bg-red-950/40 text-red-400 border-red-500/40'
          }`}
        >
          <span>
            {isPositive ? `+${delta}` : delta} PTS
          </span>
        </div>
      </div>

      {/* 3. Guard-Rail Banner (when present) */}
      {result.guard_rails && result.guard_rails.length > 0 && (
        <div className="flex flex-col gap-3">
          {result.guard_rails.map((gr, i) => (
            <div
              key={i}
              className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-amber-200">{gr.code.replace(/_/g, ' ')}</div>
                  <p className="text-xs text-amber-300/80 leading-relaxed mt-0.5">{gr.message}</p>
                </div>
              </div>

              {gr.suggestion && onCounterProposal && (
                <button
                  type="button"
                  onClick={() => {
                    const match = gr.suggestion?.match(/₹[\d,]+/);
                    if (match) {
                      const cleanAmt = match[0].replace(/[^\d]/g, '');
                      onCounterProposal(cleanAmt);
                    }
                  }}
                  disabled={isLoading}
                  className="liquid-glass-btn px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 shrink-0 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                  {gr.suggestion.split('—')[0] || 'Apply Safe Counter-Proposal'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 4. Concrete Money Facts */}
      {result.money_facts && result.money_facts.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Financial Impact
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {result.money_facts.map((mf, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium">{mf.label}</span>
                <span className="font-semibold text-white text-base sm:text-lg">{mf.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Component Deltas */}
      {movedComponents.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Affected Scoring Factors
          </h4>
          <div className="flex flex-col gap-2">
            {movedComponents.map((c, i) => {
              const d = typeof c.delta === 'string' ? parseFloat(c.delta) : c.delta;
              const pos = d > 0;
              return (
                <div
                  key={i}
                  className="bg-white/[0.02] border border-border/50 rounded-xl px-4 py-3 flex items-center justify-between text-xs sm:text-sm"
                >
                  <span className="capitalize font-medium text-zinc-300">
                    {c.component.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      {c.before} → {c.after}
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded ${
                        pos ? 'text-emerald-400 bg-emerald-950/30' : 'text-red-400 bg-red-950/30'
                      }`}
                    >
                      {pos ? `+${d}` : d}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Narrative Explanation Prose */}
      {result.explanation && (
        <div className="bg-primary/10 border border-primary/20 p-5 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck size={16} /> Plain English Breakdown
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed font-normal">
            {result.explanation}
          </p>
        </div>
      )}

      {/* 7. Export Action Button */}
      <div className="flex justify-end pt-2 border-t border-white/5">
        <button
          onClick={() => setShowReport(true)}
          className="liquid-glass-btn px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10 shadow-sm"
        >
          <FileText size={15} className="text-primary" />
          <span>Export Official Advisory Report</span>
        </button>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        result={result}
        actionTitle={result.headline || 'Simulated Financial Action'}
      />
    </div>
  );
}

