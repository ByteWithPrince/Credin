/**
 * TypeScript definitions matching CreditIn backend models.
 * All monetary amounts are string to preserve Decimal precision crossing JSON.
 */

export type AccountKind = "credit_card" | "secured_loan" | "unsecured_loan" | "bnpl";

export interface Account {
  id: string;
  kind: AccountKind;
  issuer: string;
  display_name: string;
  last4?: string | null;
  balance: string;
  credit_limit?: string | null;
  interest_rate: string;
  min_payment?: string | null;
  emi?: string | null;
  opened_date: string;
  closed_date?: string | null;
}

export interface PaymentEvent {
  account_id: string;
  due_date: string;
  paid_date?: string | null;
  days_late: number;
}

export interface FinancialState {
  user_id: string;
  display_name: string;
  monthly_income: string;
  rent: string;
  other_expenses: string;
  emergency_fund: string;
  accounts: Account[];
  payments: PaymentEvent[];
}

export interface ComponentScores {
  utilization: string | number;
  payment: string | number;
  foir: string | number;
  cash_flow: string | number;
  emergency: string | number;
  age_mix: string | number;
  overall: number;
  band: "Critical" | "At Risk" | "Fair" | "Healthy" | "Strong";
}

export interface Persona {
  id: string;
  display_name: string;
  age?: number;
  occupation?: string;
  tagline: string;
  overall_score: number;
  band: string;
}

export interface ComponentDelta {
  component: string;
  before: string | number;
  after: string | number;
  delta: string | number;
}

export interface MoneyFact {
  label: string;
  value: string;
  raw: string | number;
}

export interface GuardRail {
  code: string;
  severity: "info" | "warning" | "block";
  message: string;
  suggestion?: string | null;
}

export interface ScenarioResult {
  kind: "pay_debt" | "close_card" | "take_loan";
  score_before: number;
  score_after: number;
  band_before: string;
  band_after: string;
  component_deltas: ComponentDelta[];
  money_facts: MoneyFact[];
  guard_rails: GuardRail[];
  verdict: "good" | "caution" | "bad";
  headline: string;
  explanation?: string | null;
}

export interface MonthlyTimelinePoint {
  month: number;
  total_balance: string | number;
  total_interest_paid_to_date: string | number;
}

export interface OptimizerResult {
  strategy: string;
  months_to_debt_free: number;
  total_interest_paid: string | number;
  payoff_order: string[];
  monthly_timeline: MonthlyTimelinePoint[];
  score_at_completion: number;
  interest_saved_vs_worst: string | number;
}

export interface ParsedIntent {
  kind: "pay_debt" | "close_card" | "take_loan";
  account_id?: string | null;
  account_name?: string | null;
  amount?: string | number | null;
  principal?: string | number | null;
  annual_rate_pct?: string | number | null;
  months?: number | null;
  kind_of_loan?: AccountKind | null;
  confidence: number;
  source: "keyword" | "llm";
}

/** Converts money string to number ONLY for Recharts / chart plotting — never for calculation or formatting. */
export function toNumber(money: string | number): number {
  if (typeof money === "number") return money;
  return parseFloat(money) || 0;
}
