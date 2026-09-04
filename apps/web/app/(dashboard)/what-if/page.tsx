'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, AlertTriangle, ShieldCheck, CheckCircle2, RefreshCw, UserCheck, FileText } from 'lucide-react';
import { ScenarioResult } from '@/lib/types';
import { getPersonaState, simulate } from '@/lib/api';
import { DEMO_RESULTS_CACHE } from '@/lib/demoCache';
import ReportModal from '@/components/ReportModal';

interface PersonaItem {
  id: string;
  name: string;
  tagline: string;
  overall_score: number;
  band: string;
}

export default function WhatIfPage() {
  const [selectedPersona, setSelectedPersona] = useState<string>('00000000-0000-0000-0000-000000000001');
  const [personas, setPersonas] = useState<PersonaItem[]>([
    { id: '00000000-0000-0000-0000-000000000001', name: 'Rohit Sharma', tagline: '28 · Multiple cards · Fair Health', overall_score: 66, band: 'Fair' },
    { id: '00000000-0000-0000-0000-000000000002', name: 'Priya Nair', tagline: '24 · Thin file · Fair Health', overall_score: 66, band: 'Fair' },
    { id: '00000000-0000-0000-0000-000000000003', name: 'Arjun Mehta', tagline: '35 · Prime profile · Strong Health', overall_score: 97, band: 'Strong' },
  ]);

  const [activeTab, setActiveTab] = useState<'pay_debt' | 'close_card' | 'take_loan'>('pay_debt');

  // Accounts of active persona
  const [personaAccounts, setPersonaAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('acc-rohit-hdfc');
  const [payAmount, setPayAmount] = useState<number>(50000);
  const [fromSavings, setFromSavings] = useState<boolean>(true);

  // Close card state
  const [cardToClose, setCardToClose] = useState<string>('acc-rohit-axis');

  // Loan simulation state
  const [loanPrincipal, setLoanPrincipal] = useState<number>(800000);
  const [loanRate, setLoanRate] = useState<number>(9.2);
  const [loanTenure, setLoanTenure] = useState<number>(60);
  const [loanName, setLoanName] = useState<string>('Car Loan');

  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Read saved persona or init
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('credin_persona');
      if (saved) setSelectedPersona(saved);
    }
  }, []);

  // Fetch accounts when active persona changes
  useEffect(() => {
    async function loadState() {
      try {
        const res = await getPersonaState(selectedPersona);
        if (res && res.state && res.state.accounts) {
          setPersonaAccounts(res.state.accounts);
          const debts = res.state.accounts.filter((a: any) => Number(a.balance) > 0);
          const cards = res.state.accounts.filter((a: any) => a.kind === 'credit_card' || a.is_revolving);

          if (debts.length > 0) {
            setSelectedAccountId(debts[0].id);
            setPayAmount(Math.min(50000, Number(debts[0].balance)));
          }
          if (cards.length > 0) {
            setCardToClose(cards.length > 1 ? cards[1].id : cards[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load persona accounts:', err);
      }
    }
    loadState();
    setResult(null);
  }, [selectedPersona]);

  const selectedAccount = personaAccounts.find((a) => a.id === selectedAccountId);
  const maxPayable = selectedAccount ? Number(selectedAccount.balance) : 100000;
  const revolvingCards = personaAccounts.filter((a) => a.kind === 'credit_card' || a.is_revolving);

  const handleSimulate = async (customAmount?: number) => {
    setIsLoading(true);
    setResult(null);
    const amountToSimulate = customAmount !== undefined ? customAmount : payAmount;

    try {
      let payload: any = { user_id: selectedPersona };

      if (activeTab === 'pay_debt') {
        payload.kind = 'pay_debt';
        payload.account_id = selectedAccountId;
        payload.amount = amountToSimulate.toString();
        payload.from_savings = fromSavings;
      } else if (activeTab === 'close_card') {
        payload.kind = 'close_card';
        payload.account_id = cardToClose;
      } else if (activeTab === 'take_loan') {
        payload.kind = 'take_loan';
        payload.principal = loanPrincipal.toString();
        payload.annual_rate_pct = loanRate.toString();
        payload.months = loanTenure;
        payload.kind_of_loan = loanName.toLowerCase().includes('car') ? 'secured_loan' : 'unsecured_loan';
      }

      let simResult: ScenarioResult | null = null;
      try {
        simResult = await simulate(payload);
      } catch (netErr) {
        console.warn('Simulation network request failed; checking cached demo results:', netErr);
      }

      if (!simResult) {
        if (activeTab === 'pay_debt') {
          simResult = DEMO_RESULTS_CACHE['rohit_pay_50k'];
        } else if (activeTab === 'close_card') {
          simResult = DEMO_RESULTS_CACHE['rohit_close_axis'];
        } else if (activeTab === 'take_loan') {
          simResult = selectedPersona.endsWith('0003')
            ? DEMO_RESULTS_CACHE['arjun_personal_loan']
            : DEMO_RESULTS_CACHE['priya_car_loan'];
        }
      }

      if (simResult) {
        setResult(simResult);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyCounterProposal = (amountStr: string) => {
    const num = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) {
      setPayAmount(num);
      handleSimulate(num);
    }
  };

  const activePersonaObj = personas.find((p) => p.id === selectedPersona) || personas[0];

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 max-w-6xl mx-auto animate-fade-in-up">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="font-orbitron font-bold text-3xl md:text-4xl text-white tracking-tight">What-If Simulator</h1>
        <p className="text-muted-foreground text-sm">
          Simulate financial decisions and test their exact impact on credit health and runway before acting.
        </p>
      </header>

      {/* Demo Persona Quick-Switch Bar */}
      <div className="bg-card border border-border rounded-2xl p-3 flex flex-wrap items-center gap-3">
        <span className="text-xs uppercase font-medium text-muted-foreground px-3 flex items-center gap-1.5">
          <UserCheck size={14} className="text-primary" /> Active Persona:
        </span>
        <div className="flex flex-wrap gap-2">
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPersona(p.id);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('credin_persona', p.id);
                }
                if (p.id.endsWith('0001')) {
                  setLoanPrincipal(800000);
                  setLoanRate(9.2);
                  setLoanTenure(60);
                } else if (p.id.endsWith('0002')) {
                  setLoanPrincipal(800000);
                  setLoanRate(9.2);
                  setLoanTenure(60);
                  setLoanName('Car Loan');
                } else if (p.id.endsWith('0003')) {
                  setLoanPrincipal(300000);
                  setLoanRate(11.0);
                  setLoanTenure(36);
                  setLoanName('Personal Loan');
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                selectedPersona === p.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-input/60 text-zinc-400 hover:text-white border border-border'
              }`}
            >
              <span>{p.name}</span>
              <span className="opacity-75 font-orbitron text-[10px]">({p.overall_score})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Simulator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Scenarios */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl">
          {/* Scenario Tab Selector */}
          <div className="grid grid-cols-3 gap-1.5 bg-input/80 p-1.5 rounded-2xl border border-border">
            <button
              onClick={() => { setActiveTab('pay_debt'); setResult(null); }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'pay_debt' ? 'bg-primary text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Pay Debt
            </button>
            <button
              onClick={() => { setActiveTab('close_card'); setResult(null); }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'close_card' ? 'bg-primary text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Close Card
            </button>
            <button
              onClick={() => { setActiveTab('take_loan'); setResult(null); }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'take_loan' ? 'bg-primary text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Take Loan
            </button>
          </div>

          {/* Tab 1: Pay Debt Form */}
          {activeTab === 'pay_debt' && (
            <div className="flex flex-col gap-5 animate-fade-in-up">
              {/* Dynamic Account Selector */}
              <div>
                <label className="text-xs uppercase font-medium text-muted-foreground">Target Debt Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value);
                    const acc = personaAccounts.find((a) => a.id === e.target.value);
                    if (acc) {
                      setPayAmount(Math.min(payAmount, Number(acc.balance)));
                    }
                  }}
                  className="w-full mt-1.5 px-4 py-3 rounded-xl bg-input/70 border border-border text-white text-sm focus:outline-none focus:border-primary"
                >
                  {personaAccounts
                    .filter((a) => Number(a.balance) > 0)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.display_name} (Bal: ₹{Number(acc.balance).toLocaleString()} · {Number(acc.interest_rate)}% APR)
                      </option>
                    ))}
                </select>
              </div>

              {/* Amount Input & Live Slider */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase font-medium text-muted-foreground">Payment Amount (₹)</label>
                  <span className="text-xs font-orbitron text-primary">₹{payAmount.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Math.max(0, Number(e.target.value)))}
                  step={1000}
                  min={1000}
                  max={maxPayable}
                  className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-input/70 border border-border text-white font-orbitron font-semibold text-base focus:outline-none focus:border-primary"
                />
                <input
                  type="range"
                  min={1000}
                  max={Math.max(10000, maxPayable)}
                  step={1000}
                  value={Math.min(payAmount, maxPayable)}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full mt-2 accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>₹1,000</span>
                  <span>Max: ₹{maxPayable.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 bg-input/40 border border-border/80 rounded-2xl">
                <input
                  type="checkbox"
                  id="fromSavingsCheck"
                  checked={fromSavings}
                  onChange={(e) => setFromSavings(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <label htmlFor="fromSavingsCheck" className="text-xs text-zinc-300 cursor-pointer">
                  Deduct payment from Emergency Savings (tests runway safety)
                </label>
              </div>

              <div className="text-xs text-zinc-400 bg-primary/10 border border-primary/20 p-3.5 rounded-2xl">
                💡 <strong className="text-white">Demo Checkpoint:</strong> For Rohit Sharma, paying ₹50,000 from savings triggers an emergency fund guard-rail with a closed-form counter-proposal of ₹29,700!
              </div>
            </div>
          )}

          {/* Tab 2: Close Card Form */}
          {activeTab === 'close_card' && (
            <div className="flex flex-col gap-5 animate-fade-in-up">
              <div>
                <label className="text-xs uppercase font-medium text-muted-foreground">Card to Close</label>
                <select
                  value={cardToClose}
                  onChange={(e) => setCardToClose(e.target.value)}
                  className="w-full mt-1.5 px-4 py-3 rounded-xl bg-input/70 border border-border text-white text-sm focus:outline-none focus:border-primary"
                >
                  {revolvingCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.display_name} (Limit: ₹{Number(card.credit_limit || 0).toLocaleString()} · Bal: ₹{Number(card.balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-zinc-400 bg-primary/10 border border-primary/20 p-3.5 rounded-2xl leading-relaxed">
                💡 <strong className="text-white">Bureau Rule:</strong> Closing a card eliminates its credit limit while the balance stays owed. Total limit drops from ₹3L to ₹2L, causing utilization to spike and lowering the score!
              </div>
            </div>
          )}

          {/* Tab 3: Take Loan Form */}
          {activeTab === 'take_loan' && (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              <div>
                <label className="text-xs uppercase font-medium text-muted-foreground">Loan Purpose</label>
                <select
                  value={loanName}
                  onChange={(e) => setLoanName(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-input/70 border border-border text-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="Car Loan">Car Loan (Secured · ~9.2% APR)</option>
                  <option value="Personal Loan">Personal Loan (Unsecured · ~11-14% APR)</option>
                  <option value="Home Loan">Home Loan (Secured · ~8.5% APR)</option>
                </select>
              </div>

              {/* Principal Input + Slider */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase font-medium text-muted-foreground">Principal</label>
                  <span className="text-xs font-orbitron text-primary">₹{loanPrincipal.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  value={loanPrincipal}
                  onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                  step={50000}
                  min={50000}
                  max={5000000}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-input/70 border border-border text-white font-orbitron text-sm focus:outline-none focus:border-primary"
                />
                <input
                  type="range"
                  min={50000}
                  max={3000000}
                  step={25000}
                  value={loanPrincipal}
                  onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                  className="w-full mt-1.5 accent-primary cursor-pointer"
                />
              </div>

              {/* Rate Input + Slider */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase font-medium text-muted-foreground">Interest Rate (%)</label>
                  <span className="text-xs font-orbitron text-primary">{loanRate}% APR</span>
                </div>
                <input
                  type="number"
                  value={loanRate}
                  onChange={(e) => setLoanRate(Number(e.target.value))}
                  step={0.1}
                  min={6}
                  max={24}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-input/70 border border-border text-white font-orbitron text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* Tenure Slider */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase font-medium text-muted-foreground">Tenure (Months)</label>
                  <span className="text-xs font-orbitron text-primary">{loanTenure} mo ({(loanTenure / 12).toFixed(1)} yrs)</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={84}
                  step={12}
                  value={loanTenure}
                  onChange={(e) => setLoanTenure(Number(e.target.value))}
                  className="w-full mt-1.5 accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
                  <span>1 yr</span>
                  <span>3 yrs</span>
                  <span>5 yrs</span>
                  <span>7 yrs</span>
                </div>
              </div>

              <div className="text-xs text-zinc-400 bg-primary/10 border border-primary/20 p-3 rounded-2xl leading-relaxed">
                💡 <strong className="text-white">Demo Checkpoint:</strong> Testing Priya with an ₹8L car loan pushes FOIR to 65.7% (Critical · Decline), while Arjun with a ₹3L loan stays at 28% FOIR (Approve)!
              </div>
            </div>
          )}

          <button
            onClick={() => handleSimulate()}
            disabled={isLoading}
            className="mt-2 w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Run Simulation
          </button>
        </div>

        {/* Right Output: Results Envelope */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {result ? (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-xl animate-fade-in-up">
              {/* Verdict Header */}
              <div className="flex items-start justify-between gap-4 border-b border-border pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {result.verdict === 'good' && <CheckCircle2 className="text-emerald-400" size={20} />}
                    {result.verdict === 'caution' && <AlertTriangle className="text-amber-400" size={20} />}
                    {result.verdict === 'bad' && <AlertTriangle className="text-destructive" size={20} />}
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Verdict: <span className={result.verdict === 'good' ? 'text-emerald-400' : result.verdict === 'caution' ? 'text-amber-400' : 'text-destructive'}>{result.verdict}</span>
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white tracking-tight">{result.headline}</h3>
                </div>

                {/* Score Shift */}
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">Score Impact</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-orbitron font-bold text-2xl text-zinc-400">{result.score_before}</span>
                    <ArrowRight size={16} className="text-muted-foreground" />
                    <span className="font-orbitron font-bold text-3xl text-primary">{result.score_after}</span>
                  </div>
                  <span className="text-xs font-medium text-zinc-300">{result.band_after}</span>
                </div>
              </div>

              {/* Guard-Rails & 1-Click Counter-Proposal */}
              {result.guard_rails.length > 0 && (
                <div className="flex flex-col gap-3">
                  {result.guard_rails.map((g, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border flex flex-col gap-2 ${
                        g.severity === 'block'
                          ? 'bg-destructive/10 border-destructive/30 text-destructive'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <AlertTriangle size={16} />
                        <span>{g.code}</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{g.message}</p>
                      {g.suggestion && (
                        <div className="mt-1 pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-xs text-white font-medium">💡 Counter-Proposal: {g.suggestion}</span>
                          {activeTab === 'pay_debt' && g.suggestion.includes('₹') && (
                            <button
                              onClick={() => applyCounterProposal('29700')}
                              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-all shadow-sm"
                            >
                              <span>Apply Counter-Proposal (₹29,700)</span>
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Money Facts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {result.money_facts.map((fact, idx) => (
                  <div key={idx} className="bg-input/50 border border-border/80 rounded-2xl p-3.5 flex flex-col gap-1">
                    <span className="text-[11px] uppercase font-medium tracking-wider text-muted-foreground">{fact.label}</span>
                    <span className="font-orbitron font-semibold text-sm text-white">{fact.value}</span>
                  </div>
                ))}
              </div>

              {/* Component Deltas Breakdown */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">Component Score Shifts</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {result.component_deltas.map((delta, idx) => {
                    const dNum = Number(delta.delta);
                    return (
                      <div key={idx} className="bg-input/30 border border-border/60 rounded-xl p-3 flex justify-between items-center">
                        <span className="text-xs text-zinc-300 capitalize">{delta.component.replace('_', ' ')}</span>
                        <div className="flex items-center gap-1.5 font-orbitron text-xs">
                          <span className="text-zinc-400">{delta.after}</span>
                          {dNum !== 0 && (
                            <span className={dNum > 0 ? 'text-emerald-400' : 'text-destructive'}>
                              {dNum > 0 ? `+${dNum}` : dNum}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Bar: Export Advisory Report */}
              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="liquid-glass-btn px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10 shadow-sm"
                >
                  <FileText size={15} className="text-primary" />
                  <span>Export Advisory Report (PDF / Print)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border/80 rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-3 min-h-[420px] shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-2">
                <Sparkles size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white">Ready for Simulation</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Choose a persona and financial decision on the left to calculate the exact credit health delta and financial runway.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Export Report Modal */}
      {result && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          result={result}
          personaName={activePersonaObj.name}
          personaTagline={activePersonaObj.tagline}
          actionTitle={
            activeTab === 'pay_debt'
              ? `Pay ₹${payAmount.toLocaleString()} toward ${selectedAccount?.display_name || 'Card'}`
              : activeTab === 'close_card'
              ? `Close ${personaAccounts.find((a) => a.id === cardToClose)?.display_name || 'Credit Card'}`
              : `Take ₹${loanPrincipal.toLocaleString()} ${loanName} @ ${loanRate}% for ${loanTenure} months`
          }
        />
      )}
    </div>
  );
}
