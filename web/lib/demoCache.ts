/**
 * Pre-computed deterministic demo results cache for stage reliability.
 * Acts as a safety net if network drops during demo.
 */

import { ScenarioResult, FinancialState, ComponentScores, OptimizerResult } from "./types";

export const DEMO_RESULTS_CACHE: Record<string, ScenarioResult> = {
  // Rohit: Pay ₹50,000 toward HDFC card from savings
  "rohit_pay_50k": {
    kind: "pay_debt",
    score_before: 66,
    score_after: 74,
    band_before: "Fair",
    band_after: "Healthy",
    component_deltas: [
      { component: "utilization", before: 70.0, after: 95.0, delta: 25.0 },
      { component: "payment", before: 80.0, after: 80.0, delta: 0.0 },
      { component: "foir", before: 34.2, after: 48.1, delta: 13.9 },
      { component: "cash_flow", before: 96.1, after: 100.0, delta: 3.9 },
      { component: "emergency", before: 58.2, after: 44.1, delta: -14.1 },
      { component: "age_mix", before: 49.9, after: 49.9, delta: 0.0 },
    ],
    money_facts: [
      { label: "Payment amount", value: "₹50,000.00", raw: 50000 },
      { label: "New balance", value: "₹12,000.00", raw: 12000 },
      { label: "New credit utilization", value: "13.3%", raw: 13.3 },
      { label: "Interest saved (60-month horizon)", value: "₹70,265.86", raw: 70265.86 },
    ],
    guard_rails: [
      {
        code: "EMERGENCY_FUND_BREACH",
        severity: "warning",
        message: "Your emergency runway drops from 3.5 to 2.7 months, below the safe 3.0-month floor.",
        suggestion: "Pay ₹29,700 instead — same direction, and you keep 3.0 months of runway.",
      },
    ],
    verdict: "caution",
    headline: "Paying ₹50,000.00 moves your health score from 66 (Fair) to 74 (Healthy).",
    explanation: "Paying ₹50,000.00 toward your credit balance shifts your overall Credit Health score from 66 (Fair) to 74 (Healthy). Your revolving credit utilization improves to 13.3%, saving an estimated ₹70,265.86 in interest charges over time. Caution: Your emergency runway drops from 3.5 to 2.7 months, below the safe 3.0-month floor. Pay ₹29,700 instead — same direction, and you keep 3.0 months of runway.",
  },

  // Rohit: Close Axis Ace card
  "rohit_close_axis": {
    kind: "close_card",
    score_before: 66,
    score_after: 60,
    band_before: "Fair",
    band_after: "Fair",
    component_deltas: [
      { component: "utilization", before: 70.0, after: 47.5, delta: -22.5 },
      { component: "payment", before: 80.0, after: 80.0, delta: 0.0 },
      { component: "foir", before: 34.2, after: 34.2, delta: 0.0 },
      { component: "cash_flow", before: 96.1, after: 96.1, delta: 0.0 },
      { component: "emergency", before: 58.2, after: 58.2, delta: 0.0 },
      { component: "age_mix", before: 49.9, after: 49.9, delta: 0.0 },
    ],
    money_facts: [
      { label: "Credit utilization", value: "30.0% → 45.0%", raw: 45.0 },
      { label: "Credit limit removed", value: "₹1,00,000.00", raw: 100000 },
      { label: "Available headroom lost", value: "₹72,000.00", raw: 72000 },
      { label: "Remaining card balance (still owed)", value: "₹28,000.00", raw: 28000 },
    ],
    guard_rails: [
      {
        code: "UTILIZATION_THRESHOLD_CROSSED",
        severity: "warning",
        message: "Your overall credit utilization spikes from 30.0% to 45.0%, crossing the healthy 30% threshold.",
      },
    ],
    verdict: "bad",
    headline: "Closing Axis Ace reduces total credit limit, pushing utilization from 30.0% to 45.0% and lowering your score by 6 points.",
    explanation: "Closing this credit card removes ₹1,00,000.00 of available credit limit and shifts your overall Credit Health score from 66 (Fair) to 60 (Fair). Because any remaining balance is still owed, your credit utilization spikes (30.0% → 45.0%), reducing your score. Warning: Your overall credit utilization spikes from 30.0% to 45.0%, crossing the healthy 30% threshold.",
  },

  // Priya: ₹8 Lakh Car loan
  "priya_car_loan": {
    kind: "take_loan",
    score_before: 66,
    score_after: 39,
    band_before: "Fair",
    band_after: "Critical",
    component_deltas: [
      { component: "utilization", before: 61.0, after: 61.0, delta: 0.0 },
      { component: "payment", before: 60.0, after: 60.0, delta: 0.0 },
      { component: "foir", before: 100.0, after: 0.0, delta: -100.0 },
      { component: "cash_flow", before: 100.0, after: 54.8, delta: -45.2 },
      { component: "emergency", before: 19.0, after: 8.4, delta: -10.6 },
      { component: "age_mix", before: 18.7, after: 23.3, delta: 4.6 },
    ],
    money_facts: [
      { label: "Monthly EMI", value: "₹16,684.44", raw: 16684.44 },
      { label: "Total interest over full term", value: "₹2,01,066.40", raw: 201066.40 },
      { label: "Total repayment amount", value: "₹10,01,066.40", raw: 1001066.40 },
      { label: "Debt load (FOIR)", value: "28.7% → 65.7%", raw: 65.7 },
      { label: "Remaining monthly surplus", value: "₹7,315.56", raw: 7315.56 },
    ],
    guard_rails: [
      {
        code: "FOIR_EXCEEDED",
        severity: "block",
        message: "This pushes your obligations to 65.7% of income. Lenders typically stop at 40% and strictly reject above 50%.",
        suggestion: "Consider reducing loan amount or extending tenure to lower monthly EMI.",
      },
    ],
    verdict: "bad",
    headline: "A new loan of ₹8,00,000.00 creates an EMI of ₹16,684.44/mo. Verdict: High risk (Decline recommended).",
    explanation: "Taking this loan adds a monthly EMI obligation of ₹16,684.44, which shifts your overall Credit Health score from 66 (Fair) to 39 (Critical). Your debt-to-income ratio (FOIR) moves to 28.7% → 65.7%. Underwriting warning: This pushes your obligations to 65.7% of income. Lenders typically stop at 40% and strictly reject above 50%.",
  },

  // Arjun: ₹3 Lakh Personal loan
  "arjun_personal_loan": {
    kind: "take_loan",
    score_before: 97,
    score_after: 96,
    band_before: "Strong",
    band_after: "Strong",
    component_deltas: [
      { component: "utilization", before: 100.0, after: 100.0, delta: 0.0 },
      { component: "payment", before: 100.0, after: 100.0, delta: 0.0 },
      { component: "foir", before: 100.0, after: 100.0, delta: 0.0 },
      { component: "cash_flow", before: 100.0, after: 100.0, delta: 0.0 },
      { component: "emergency", before: 87.7, after: 74.5, delta: -13.2 },
      { component: "age_mix", before: 81.6, after: 88.2, delta: 6.6 },
    ],
    money_facts: [
      { label: "Monthly EMI", value: "₹9,821.62", raw: 9821.62 },
      { label: "Total interest over full term", value: "₹53,578.32", raw: 53578.32 },
      { label: "Total repayment amount", value: "₹3,53,578.32", raw: 353578.32 },
      { label: "Debt load (FOIR)", value: "22.5% → 28.0%", raw: 28.0 },
      { label: "Remaining monthly surplus", value: "₹84,678.38", raw: 84678.38 },
    ],
    guard_rails: [],
    verdict: "good",
    headline: "A new loan of ₹3,00,000.00 creates an EMI of ₹9,821.62/mo. Verdict: Affordable (Approval likely).",
    explanation: "Taking this loan adds a monthly EMI obligation of ₹9,821.62, which shifts your overall Credit Health score from 97 (Strong) to 96 (Strong). Your debt-to-income ratio (FOIR) moves to 22.5% → 28.0%. Your income comfortably covers this new obligation without straining your monthly savings surplus.",
  },
};

export const SEEDED_SCORES: Record<string, any> = {
  "00000000-0000-0000-0000-000000000001": {
    user_id: "00000000-0000-0000-0000-000000000001",
    display_name: "Rohit Sharma",
    overall: 66,
    band: "Fair",
    components: {
      foir: { score: 34.2, weight: 20, raw: "48.9%", reading: "High debt obligations (48.9% of income)" },
      age_mix: { score: 49.9, weight: 8, raw: "34.7 mo avg, 2 types", reading: "Moderate credit history with 2 account types" },
      emergency: { score: 58.2, weight: 10, raw: "3.5 months", reading: "Adequate runway (3.5 months of obligations)" },
      utilization: { score: 70.0, weight: 25, raw: "30.0%", reading: "Revolving utilization is 30.0% (healthy, at 30% target)" },
      payment: { score: 80.0, weight: 25, raw: "80%", reading: "Good track record with minor late payments in trailing 12 months" },
      cash_flow: { score: 96.1, weight: 12, raw: "28.8%", reading: "Strong monthly savings surplus" },
    },
  },
  "00000000-0000-0000-0000-000000000002": {
    user_id: "00000000-0000-0000-0000-000000000002",
    display_name: "Priya Nair",
    overall: 66,
    band: "Fair",
    components: {
      age_mix: { score: 18.7, weight: 8, raw: "8.0 mo avg, 1 type", reading: "Thin file with limited credit history" },
      emergency: { score: 19.0, weight: 10, raw: "1.1 months", reading: "Low emergency savings runway" },
      payment: { score: 60.0, weight: 25, raw: "Thin file", reading: "Thin credit file with limited payment track record" },
      utilization: { score: 61.0, weight: 25, raw: "36.0%", reading: "Slightly elevated card utilization at 36.0%" },
      foir: { score: 100.0, weight: 20, raw: "28.7%", reading: "Low debt obligations relative to entry-level income" },
      cash_flow: { score: 100.0, weight: 12, raw: "35.8%", reading: "Healthy savings surplus" },
    },
  },
  "00000000-0000-0000-0000-000000000003": {
    user_id: "00000000-0000-0000-0000-000000000003",
    display_name: "Arjun Mehta",
    overall: 97,
    band: "Strong",
    components: {
      age_mix: { score: 88.0, weight: 8, raw: "62.0 mo avg, 3 types", reading: "Mature, diverse credit portfolio" },
      emergency: { score: 100.0, weight: 10, raw: "6.0+ months", reading: "Robust 6+ month emergency cushion" },
      utilization: { score: 98.0, weight: 25, raw: "11.1%", reading: "Excellent low utilization across premium cards" },
      payment: { score: 100.0, weight: 25, raw: "100%", reading: "Flawless on-time payment track record" },
      foir: { score: 100.0, weight: 20, raw: "22.5%", reading: "Extremely low debt obligations (22.5% of income)" },
      cash_flow: { score: 100.0, weight: 12, raw: "52.5%", reading: "Exceptional cash flow and savings surplus" },
    },
  },
};

export const SEEDED_PERSONA_STATES: Record<string, { state: FinancialState; scores: ComponentScores }> = {
  "00000000-0000-0000-0000-000000000001": {
    state: {
      user_id: "00000000-0000-0000-0000-000000000001",
      display_name: "Rohit Sharma",
      monthly_income: "72000.00",
      rent: "20000.00",
      other_expenses: "16000.00",
      emergency_fund: "179000.00",
      accounts: [
        {
          id: "acc-rohit-hdfc",
          kind: "credit_card",
          issuer: "HDFC",
          display_name: "HDFC Regalia",
          last4: "4821",
          balance: "62000.00",
          credit_limit: "200000.00",
          interest_rate: "42.0",
          min_payment: "3100.00",
          opened_date: "2020-07-01",
          closed_date: null,
        },
        {
          id: "acc-rohit-axis",
          kind: "credit_card",
          issuer: "Axis",
          display_name: "Axis Ace",
          last4: "9032",
          balance: "28000.00",
          credit_limit: "100000.00",
          interest_rate: "41.0",
          min_payment: "1400.00",
          opened_date: "2024-05-01",
          closed_date: null,
        },
        {
          id: "acc-rohit-bajaj",
          kind: "unsecured_loan",
          issuer: "Bajaj",
          display_name: "Personal Loan",
          last4: null,
          balance: "500000.00",
          credit_limit: null,
          interest_rate: "10.5",
          emi: "10746.95",
          opened_date: "2025-01-01",
          closed_date: null,
        },
      ],
      payments: [],
    },
    scores: {
      utilization: 70.0,
      payment: 80.0,
      foir: 34.2,
      cash_flow: 96.1,
      emergency: 58.2,
      age_mix: 49.9,
      overall: 66,
      band: "Fair",
    },
  },
  "00000000-0000-0000-0000-000000000002": {
    state: {
      user_id: "00000000-0000-0000-0000-000000000002",
      display_name: "Priya Nair",
      monthly_income: "45000.00",
      rent: "12000.00",
      other_expenses: "9000.00",
      emergency_fund: "25000.00",
      accounts: [
        {
          id: "acc-priya-sbi",
          kind: "credit_card",
          issuer: "SBI",
          display_name: "SBI SimplyCLICK",
          last4: "1174",
          balance: "18000.00",
          credit_limit: "50000.00",
          interest_rate: "43.0",
          min_payment: "900.00",
          opened_date: "2025-07-01",
          closed_date: null,
        },
      ],
      payments: [],
    },
    scores: {
      utilization: 61.0,
      payment: 60.0,
      foir: 100.0,
      cash_flow: 100.0,
      emergency: 19.0,
      age_mix: 18.7,
      overall: 66,
      band: "Fair",
    },
  },
  "00000000-0000-0000-0000-000000000003": {
    state: {
      user_id: "00000000-0000-0000-0000-000000000003",
      display_name: "Arjun Mehta",
      monthly_income: "180000.00",
      rent: "0.00",
      other_expenses: "45000.00",
      emergency_fund: "450000.00",
      accounts: [
        {
          id: "acc-arjun-icici",
          kind: "credit_card",
          issuer: "ICICI",
          display_name: "ICICI Sapphiro",
          last4: "6650",
          balance: "35000.00",
          credit_limit: "300000.00",
          interest_rate: "40.0",
          min_payment: "1750.00",
          opened_date: "2017-01-01",
          closed_date: null,
        },
        {
          id: "acc-arjun-amex",
          kind: "credit_card",
          issuer: "Amex",
          display_name: "Amex Platinum Travel",
          last4: "3319",
          balance: "15000.00",
          credit_limit: "200000.00",
          interest_rate: "38.0",
          min_payment: "750.00",
          opened_date: "2021-03-01",
          closed_date: null,
        },
        {
          id: "acc-arjun-home",
          kind: "secured_loan",
          issuer: "HDFC",
          display_name: "Home Loan",
          last4: null,
          balance: "4200000.00",
          credit_limit: null,
          interest_rate: "8.6",
          emi: "38000.00",
          opened_date: "2022-03-01",
          closed_date: null,
        },
      ],
      payments: [],
    },
    scores: {
      utilization: 98.0,
      payment: 100.0,
      foir: 100.0,
      cash_flow: 100.0,
      emergency: 100.0,
      age_mix: 88.0,
      overall: 97,
      band: "Strong",
    },
  },
};

export const SEEDED_OPTIMIZER_RESULTS: Record<string, OptimizerResult[]> = {
  "00000000-0000-0000-0000-000000000001": [
    {
      strategy: "avalanche",
      months_to_debt_free: 28,
      total_interest_paid: "142850.00",
      payoff_order: ["HDFC Regalia (42.0%)", "Axis Ace (41.0%)", "Personal Loan (10.5%)"],
      monthly_timeline: [
        { month: 1, total_balance: "590000.00", total_interest_paid_to_date: "6540.00" },
        { month: 6, total_balance: "495000.00", total_interest_paid_to_date: "35800.00" },
        { month: 12, total_balance: "380000.00", total_interest_paid_to_date: "67200.00" },
        { month: 18, total_balance: "250000.00", total_interest_paid_to_date: "95100.00" },
        { month: 24, total_balance: "110000.00", total_interest_paid_to_date: "123400.00" },
        { month: 28, total_balance: "0.00", total_interest_paid_to_date: "142850.00" },
      ],
      score_at_completion: 82,
      interest_saved_vs_worst: "34820.00",
    },
    {
      strategy: "snowball",
      months_to_debt_free: 29,
      total_interest_paid: "148200.00",
      payoff_order: ["Axis Ace (₹28,000)", "HDFC Regalia (₹62,000)", "Personal Loan (₹5,00,000)"],
      monthly_timeline: [
        { month: 1, total_balance: "590000.00", total_interest_paid_to_date: "6540.00" },
        { month: 6, total_balance: "502000.00", total_interest_paid_to_date: "37100.00" },
        { month: 12, total_balance: "390000.00", total_interest_paid_to_date: "69800.00" },
        { month: 18, total_balance: "262000.00", total_interest_paid_to_date: "99400.00" },
        { month: 24, total_balance: "122000.00", total_interest_paid_to_date: "128900.00" },
        { month: 29, total_balance: "0.00", total_interest_paid_to_date: "148200.00" },
      ],
      score_at_completion: 82,
      interest_saved_vs_worst: "29470.00",
    },
    {
      strategy: "balanced",
      months_to_debt_free: 28,
      total_interest_paid: "144600.00",
      payoff_order: ["HDFC Regalia (42.0%)", "Axis Ace (41.0%)", "Personal Loan (10.5%)"],
      monthly_timeline: [
        { month: 1, total_balance: "590000.00", total_interest_paid_to_date: "6540.00" },
        { month: 6, total_balance: "498000.00", total_interest_paid_to_date: "36200.00" },
        { month: 12, total_balance: "384000.00", total_interest_paid_to_date: "68100.00" },
        { month: 18, total_balance: "254000.00", total_interest_paid_to_date: "96500.00" },
        { month: 24, total_balance: "114000.00", total_interest_paid_to_date: "125100.00" },
        { month: 28, total_balance: "0.00", total_interest_paid_to_date: "144600.00" },
      ],
      score_at_completion: 82,
      interest_saved_vs_worst: "33070.00",
    },
  ],
};

/**
 * Looks up a pre-seeded demo result if the simulation query matches one of the 5 canonical demo beats.
 */
export function getCachedDemoResult(userId: string, query: string): ScenarioResult | null {
  const q = query.toLowerCase();

  // Rohit beats (User ID ending in 0001 or explicitly Rohit)
  if (userId.endsWith("0001") || q.includes("rohit")) {
    if (q.includes("50,000") || q.includes("50000") || q.includes("50k") || q.includes("hdfc")) {
      return DEMO_RESULTS_CACHE["rohit_pay_50k"] || null;
    }
    if (q.includes("close") || q.includes("axis") || q.includes("shut") || q.includes("cancel")) {
      return DEMO_RESULTS_CACHE["rohit_close_axis"] || null;
    }
  }

  // Priya beat (8L Car Loan)
  if (userId.endsWith("0002") || q.includes("priya") || q.includes("car") || q.includes("8 lakh") || q.includes("8l")) {
    return DEMO_RESULTS_CACHE["priya_car_loan"] || null;
  }

  // Arjun beat (3L Personal Loan)
  if (userId.endsWith("0003") || q.includes("arjun") || q.includes("3 lakh") || q.includes("3l")) {
    return DEMO_RESULTS_CACHE["arjun_personal_loan"] || null;
  }

  return null;
}

export function getSeededScore(userId: string): any {
  if (userId.endsWith("0002") || userId.toLowerCase().includes("priya")) {
    return SEEDED_SCORES["00000000-0000-0000-0000-000000000002"];
  }
  if (userId.endsWith("0003") || userId.toLowerCase().includes("arjun")) {
    return SEEDED_SCORES["00000000-0000-0000-0000-000000000003"];
  }
  return SEEDED_SCORES["00000000-0000-0000-0000-000000000001"];
}

export function getSeededPersonaState(personaId: string): { state: FinancialState; scores: ComponentScores } {
  if (personaId.endsWith("0002") || personaId.toLowerCase().includes("priya")) {
    return SEEDED_PERSONA_STATES["00000000-0000-0000-0000-000000000002"];
  }
  if (personaId.endsWith("0003") || personaId.toLowerCase().includes("arjun")) {
    return SEEDED_PERSONA_STATES["00000000-0000-0000-0000-000000000003"];
  }
  return SEEDED_PERSONA_STATES["00000000-0000-0000-0000-000000000001"];
}

export function getSeededOptimizerResults(userId: string, strategy?: string): OptimizerResult | OptimizerResult[] {
  const rohitResults = SEEDED_OPTIMIZER_RESULTS["00000000-0000-0000-0000-000000000001"];
  if (strategy) {
    const match = rohitResults.find((r) => r.strategy.toLowerCase() === strategy.toLowerCase());
    return match || rohitResults[0];
  }
  return rohitResults;
}

export function getSeededImprovementPlan(userId: string): any {
  if (userId.endsWith("0002") || userId.toLowerCase().includes("priya")) {
    return {
      plan_type: "score_improvement",
      user_id: "00000000-0000-0000-0000-000000000002",
      display_name: "Priya Nair",
      current_score: 66,
      target_score: 82,
      band: "Fair",
      weaknesses: ["Thin Credit File / Needs Account Aging", "Limited Account Mix"],
      milestones: [
        {
          month_number: 1,
          title: "Build On-Time Payment Track Record",
          description: "Set up auto-debit on your primary credit card for small utility spends to start establishing an active bureau history.",
          targets: { on_time_pct: 100 },
        },
        {
          month_number: 2,
          title: "Keep Card Utilization Under 20%",
          description: "Given your ₹50,000 credit limit, ensure statement balance never crosses ₹10,000 before the billing cycle ends.",
          targets: { utilization_below: 20 },
        },
        {
          month_number: 3,
          title: "Avoid Premature Loan Applications",
          description: "Hold off on car or personal loan hard inquiries until your bureau history reaches at least 12 months.",
          targets: { hard_inquiries: 0 },
        },
      ],
    };
  }

  if (userId.endsWith("0003") || userId.toLowerCase().includes("arjun")) {
    return {
      plan_type: "score_improvement",
      user_id: "00000000-0000-0000-0000-000000000003",
      display_name: "Arjun Mehta",
      current_score: 97,
      target_score: 100,
      band: "Strong",
      weaknesses: ["Prime Health Profile — Optimization Focus"],
      milestones: [
        {
          month_number: 1,
          title: "Maintain Pristine Payment Track Record",
          description: "Ensure scheduled auto-debit for your ₹24,286 home loan EMI and card statements remain unbroken.",
          targets: { on_time_pct: 100 },
        },
        {
          month_number: 2,
          title: "Optimize Credit Card Utilization",
          description: "Continue keeping revolving card utilization strictly under 10% across ICICI and Amex.",
          targets: { utilization_below: 10 },
        },
      ],
    };
  }

  // Rohit default
  return {
    plan_type: "score_improvement",
    user_id: "00000000-0000-0000-0000-000000000001",
    display_name: "Rohit Sharma",
    current_score: 66,
    target_score: 82,
    band: "Fair",
    weaknesses: [
      "High Credit Utilization (>30%)",
      "High Debt-to-Income / FOIR (>40%)",
      "Low Emergency Fund (<3 months runway post-spends)",
    ],
    milestones: [
      {
        month_number: 1,
        title: "Pay Down HDFC Card Balance to ₹12,000",
        description: "Direct safe savings surplus (keeping emergency runway at 3.0+ months) to reduce utilization from 30% down to 13.3%.",
        targets: { utilization_below: 20 },
      },
      {
        month_number: 2,
        title: "Do NOT Close Axis Ace Card",
        description: "Keep Axis Ace open with ₹0 balance. Closing it removes ₹1L limit and spikes total utilization to 45%.",
        targets: { keep_cards_active: true },
      },
      {
        month_number: 3,
        title: "Avalanche Payoff of Personal Loan",
        description: "After clearing card minimums, allocate remaining monthly debt budget to Bajaj loan to compress tenure and save interest.",
        targets: { foir_below: 40 },
      },
    ],
  };
}

