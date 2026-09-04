'use client';

import React from 'react';
import { X, Printer, ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { ScenarioResult } from '@/lib/types';
import { bandBadgeClass } from '@/lib/format';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ScenarioResult;
  personaName?: string;
  personaTagline?: string;
  actionTitle?: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  result,
  personaName = 'Rohit Sharma',
  personaTagline = '28 · Salaried Software Engineer · ₹72k/mo',
  actionTitle = 'Financial Decision Simulation',
}: ReportModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isPositive = (result.score_after ?? 0) >= (result.score_before ?? 0);
  const scoreDelta = (result.score_after ?? 0) - (result.score_before ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-8 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Screen Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Sparkles size={14} /> Official Advisory Simulation Summary
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="liquid-glass-btn px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 hover:bg-white/10 transition-colors"
            >
              <Printer size={14} /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              aria-label="Close report modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Advisory Document Body */}
        <div className="p-8 flex flex-col gap-6 text-zinc-100 print:text-black print:p-0 print:m-0">
          {/* Document Title Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b border-zinc-800 pb-6 print:border-zinc-300">
            <div>
              <div className="font-orbitron font-bold text-2xl tracking-wider text-white print:text-black">
                CredIn <span className="text-xs font-sans font-medium text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 print:border-black print:text-black">WHAT-IF ENGINE</span>
              </div>
              <h1 className="text-xl font-bold text-white print:text-black mt-2">
                Credit Health Advisory & Scenario Analysis
              </h1>
              <p className="text-xs text-zinc-400 print:text-zinc-600 mt-0.5">
                Evaluated for: <strong className="text-zinc-200 print:text-black">{personaName}</strong> ({personaTagline})
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-zinc-400 print:text-zinc-600">
              <p>Generated: <strong>{currentDate}</strong></p>
              <p>Ref: <strong>CID-SIM-{(result.score_after || 66).toString().padStart(3, '0')}</strong></p>
            </div>
          </div>

          {/* Decision Tested */}
          <div className="bg-zinc-900/60 print:bg-zinc-100 border border-zinc-800 print:border-zinc-300 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider print:text-zinc-800">
              Evaluated Scenario
            </span>
            <h2 className="text-base font-bold text-white print:text-black">{actionTitle}</h2>
            <p className="text-xs text-zinc-400 print:text-zinc-700 leading-relaxed">
              {result.headline || result.explanation}
            </p>
          </div>

          {/* Core Score Impact Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-semibold text-zinc-400 print:text-zinc-600 uppercase tracking-wider">
                Baseline Standing
              </span>
              <span className="font-orbitron text-3xl font-bold text-white print:text-black my-1">
                {result.score_before}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 print:bg-zinc-200 print:text-black">
                {result.band_before || 'Fair'}
              </span>
            </div>

            <div className="bg-zinc-900/50 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-semibold text-zinc-400 print:text-zinc-600 uppercase tracking-wider">
                Net Trajectory
              </span>
              <span className={`font-orbitron text-3xl font-bold my-1 ${isPositive ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
                {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta}
              </span>
              <span className="text-xs text-zinc-400 print:text-zinc-600">
                {isPositive ? 'Positive Projection' : 'Credit Headroom Loss'}
              </span>
            </div>

            <div className="bg-zinc-900/50 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Projected Score
              </span>
              <span className="font-orbitron text-3xl font-bold text-primary print:text-black my-1">
                {result.score_after}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${bandBadgeClass(result.band_after || 'Healthy')} print:bg-zinc-200 print:text-black`}>
                {result.band_after || 'Healthy'}
              </span>
            </div>
          </div>

          {/* Guard-Rail & Advisory Warnings */}
          {result.guard_rails && result.guard_rails.length > 0 && (
            <div className="bg-amber-950/20 print:bg-amber-50 border border-amber-500/30 print:border-amber-400 rounded-2xl p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-400 print:text-amber-800 font-semibold text-sm">
                <AlertTriangle size={16} />
                <span>Financial Safety Floor Alert</span>
              </div>
              {result.guard_rails.map((gr, idx) => (
                <div key={idx} className="flex flex-col gap-1 text-xs text-amber-200/90 print:text-amber-900 leading-relaxed">
                  <p>{gr.message}</p>
                  {gr.suggestion && (
                    <div className="mt-1 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 print:text-amber-950 font-medium">
                      💡 <strong>Recommended Counter-Proposal:</strong> {gr.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 6 Component Breakdown Table */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 print:text-zinc-700">
              Component Trajectory Breakdown
            </span>
            <div className="border border-zinc-800 print:border-zinc-300 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-900/80 print:bg-zinc-100 text-zinc-400 print:text-zinc-800 border-b border-zinc-800 print:border-zinc-300">
                  <tr>
                    <th className="p-3">Component</th>
                    <th className="p-3 text-right">Weight</th>
                    <th className="p-3 text-right">Before</th>
                    <th className="p-3 text-right">After</th>
                    <th className="p-3 text-right">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 print:divide-zinc-200">
                  {result.component_deltas?.map((cd, idx) => {
                    const numDelta = Number(cd.delta);
                    return (
                      <tr key={idx} className="hover:bg-zinc-900/30 print:hover:bg-transparent">
                        <td className="p-3 font-medium capitalize text-white print:text-black">
                          {cd.component.replace('_', ' ')}
                        </td>
                        <td className="p-3 text-right text-zinc-400 print:text-zinc-600">
                          {cd.component === 'utilization' || cd.component === 'payment' ? '25%' : cd.component === 'foir' ? '20%' : cd.component === 'cash_flow' ? '12%' : cd.component === 'emergency' ? '10%' : '8%'}
                        </td>
                        <td className="p-3 text-right font-orbitron">{Number(cd.before).toFixed(1)}</td>
                        <td className="p-3 text-right font-orbitron font-semibold text-white print:text-black">{Number(cd.after).toFixed(1)}</td>
                        <td className={`p-3 text-right font-orbitron font-bold ${numDelta > 0 ? 'text-emerald-400 print:text-emerald-700' : numDelta < 0 ? 'text-rose-400 print:text-rose-700' : 'text-zinc-400 print:text-zinc-600'}`}>
                          {numDelta > 0 ? `+${numDelta.toFixed(1)}` : numDelta.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          </div>

          {/* Money Facts Grid */}
          {result.money_facts && result.money_facts.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 print:text-zinc-700">
                Key Monetary Metrics
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {result.money_facts.map((mf, idx) => (
                  <div key={idx} className="bg-zinc-900/40 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-xl p-3 flex flex-col gap-0.5">
                    <span className="text-[10px] text-zinc-400 print:text-zinc-600">{mf.label}</span>
                    <strong className="font-orbitron text-xs sm:text-sm text-white print:text-black">{mf.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer & Disclaimer */}
          <div className="border-t border-zinc-800 print:border-zinc-300 pt-4 flex flex-col sm:flex-row justify-between text-[10px] text-zinc-500 print:text-zinc-600 leading-relaxed">
            <p>Calculated deterministically by CreditIn Engine. No probabilistic LLM arithmetic used.</p>
            <p className="text-zinc-500 print:text-zinc-600">Complies with RBI FOIR guidelines (FOIR healthy ≤ 40%).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
