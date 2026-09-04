"""
Scenario: Take a New Loan Simulator.
Evaluates loan affordability, FOIR impact, cash-flow surplus, and 3-way gate underwriting rules.
"""

from datetime import date
from decimal import Decimal
from typing import Optional, Literal

from app.models.domain import FinancialState, Account, AccountKind
from app.services.constants import (
    FOIR_HEALTHY,
    FOIR_OVERLEVERAGED,
    EMERGENCY_FLOOR_MONTHS,
)
from app.services.financial_math import (
    emi,
    total_interest,
    foir_ratio,
    surplus_ratio,
    months_of_coverage,
)
from app.services.health_score import compute_scores
from app.services.scenarios.base import (
    ScenarioResult,
    GuardRail,
    MoneyFact,
    ComponentDelta,
    format_inr,
)


def simulate_take_loan(
    state: FinancialState,
    principal: Decimal,
    annual_rate_pct: Decimal,
    months: int,
    kind: AccountKind = "unsecured_loan",
) -> ScenarioResult:
    """
    Simulates taking out a new term loan.
    Underwrites against FOIR healthy threshold (40%), surplus ratio, and emergency runway.
    """
    scores_before = compute_scores(state)

    # 1. Compute deterministic EMI & total interest
    loan_emi = emi(principal, annual_rate_pct, months)
    tot_interest = total_interest(principal, annual_rate_pct, months)
    tot_repayment = principal + tot_interest

    # 2. Deep copy state and append synthetic loan opened today
    new_state = state.model_copy(deep=True)
    synth_loan = Account(
        id="acc-synthetic-new-loan",
        kind=kind,
        issuer="Simulated Lender",
        display_name=f"New {kind.replace('_', ' ').title()}",
        last4=None,
        balance=principal,
        credit_limit=None,
        interest_rate=annual_rate_pct,
        min_payment=None,
        emi=loan_emi,
        opened_date=date.today(),
        closed_date=None,
    )
    new_state.accounts.append(synth_loan)

    # 3. Recompute scores
    scores_after = compute_scores(new_state)

    # 4. Component deltas
    deltas = []
    comp_names = ["utilization", "payment", "foir", "cash_flow", "emergency", "age_mix"]
    for c in comp_names:
        b = getattr(scores_before, c)
        a = getattr(scores_after, c)
        deltas.append(ComponentDelta(component=c, before=b, after=a, delta=a - b))

    # 5. Ratios & Money facts
    foir_before_pct = foir_ratio(state.total_obligations, state.monthly_income) * Decimal("100")
    foir_after = foir_ratio(new_state.total_obligations, new_state.monthly_income)
    foir_after_pct = foir_after * Decimal("100")

    surplus_after_val = new_state.monthly_income - new_state.other_expenses - new_state.total_obligations
    surplus_ratio_after = surplus_ratio(new_state.monthly_income, new_state.other_expenses, new_state.total_obligations)
    cov_after = months_of_coverage(new_state.emergency_fund, new_state.other_expenses, new_state.total_obligations)

    money_facts = [
        MoneyFact(label="Monthly EMI", value=format_inr(loan_emi), raw=loan_emi),
        MoneyFact(label="Total interest over full term", value=format_inr(tot_interest), raw=tot_interest),
        MoneyFact(label="Total repayment amount", value=format_inr(tot_repayment), raw=tot_repayment),
        MoneyFact(
            label="Debt load (FOIR)",
            value=f"{foir_before_pct:.1f}% → {foir_after_pct:.1f}%",
            raw=foir_after_pct,
        ),
        MoneyFact(label="Remaining monthly surplus", value=format_inr(surplus_after_val), raw=surplus_after_val),
    ]

    # 6. Three-way gate underwriting rules
    guard_rails = []
    failed_reasons = []

    if foir_after > FOIR_OVERLEVERAGED:
        failed_reasons.append("foir")
        guard_rails.append(
            GuardRail(
                code="FOIR_EXCEEDED",
                severity="block",
                message=f"This pushes your obligations to {foir_after_pct:.1f}% of income. Lenders typically stop at 40% and strictly reject above 50%.",
                suggestion="Consider reducing loan amount or extending tenure to lower monthly EMI.",
            )
        )
    elif foir_after > FOIR_HEALTHY:
        guard_rails.append(
            GuardRail(
                code="FOIR_CAUTION",
                severity="warning",
                message=f"Your FOIR rises to {foir_after_pct:.1f}%, slightly above the healthy 40% benchmark.",
            )
        )

    if surplus_ratio_after <= Decimal("0.0"):
        failed_reasons.append("surplus")
        guard_rails.append(
            GuardRail(
                code="NEGATIVE_SURPLUS",
                severity="block",
                message=f"This loan creates a monthly deficit of {format_inr(abs(surplus_after_val))}. Your income cannot cover expenses and EMIs.",
            )
        )

    if cov_after < EMERGENCY_FLOOR_MONTHS and state.emergency_fund > Decimal("0.0"):
        guard_rails.append(
            GuardRail(
                code="EMERGENCY_FUND_TOO_LOW",
                severity="warning",
                message=f"Higher obligations reduce your emergency fund runway to {cov_after:.1f} months (below the 3-month floor).",
            )
        )

    # 7. Verdict
    if failed_reasons:
        verdict = "bad"
    elif guard_rails:
        verdict = "caution"
    else:
        verdict = "good"

    if verdict == "bad":
        verdict_str = "High risk (Decline recommended)"
    elif verdict == "caution":
        verdict_str = "Moderate risk (Caution advised)"
    else:
        verdict_str = "Affordable (Approval likely)"

    headline = (
        f"A new loan of {format_inr(principal)} creates an EMI of {format_inr(loan_emi)}/mo. "
        f"Verdict: {verdict_str}."
    )

    return ScenarioResult(
        kind="take_loan",
        score_before=scores_before.overall,
        score_after=scores_after.overall,
        band_before=scores_before.band,
        band_after=scores_after.band,
        component_deltas=deltas,
        money_facts=money_facts,
        guard_rails=guard_rails,
        verdict=verdict,
        headline=headline,
    )
