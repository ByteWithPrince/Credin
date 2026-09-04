"""
Scenario 1: Pay Debt from Savings.
Includes Emergency Fund guard-rail and closed-form counter-proposal X_max.
"""

from copy import deepcopy
from decimal import Decimal, ROUND_FLOOR, ROUND_HALF_UP
from typing import List
from app.models.domain import FinancialState
from app.services.health_score import compute_scores
from app.services.financial_math import months_of_coverage, months_to_payoff, total_interest, utilization_ratio
from app.services.constants import EMERGENCY_FLOOR_MONTHS, MIN_PAYMENT_RATE
from app.services.scenarios.base import ScenarioResult, GuardRail, MoneyFact, ComponentDelta, format_inr


def simulate_pay_debt(
    state: FinancialState,
    account_id: str,
    amount: Decimal,
    from_savings: bool = True
) -> ScenarioResult:
    """
    Simulates paying down debt on a target account.
    """
    pay_amount = Decimal(str(amount))
    scores_before = compute_scores(state)
    coverage_before = months_of_coverage(state.emergency_fund, state.other_expenses, state.total_obligations)

    # 1. Deep-copy state
    new_state = deepcopy(state)

    # 2. Reduce target account balance
    target_acc = next((acc for acc in new_state.accounts if acc.id == account_id), None)
    if not target_acc and new_state.accounts:
        target_acc = new_state.accounts[0] # fallback

    actual_paid = Decimal("0.00")
    if target_acc:
        old_balance = target_acc.balance
        new_balance = max(Decimal("0.00"), old_balance - pay_amount)
        actual_paid = old_balance - new_balance
        target_acc.balance = new_balance

    # 3. If from_savings, reduce emergency fund
    if from_savings:
        new_state.emergency_fund = max(Decimal("0.00"), new_state.emergency_fund - actual_paid)

    # 4. Recompute scores
    scores_after = compute_scores(new_state)
    coverage_after = months_of_coverage(new_state.emergency_fund, new_state.other_expenses, new_state.total_obligations)

    # 5. Build Component Deltas
    deltas: List[ComponentDelta] = [
        ComponentDelta(component="Utilization", before=scores_before.utilization, after=scores_after.utilization, delta=scores_after.utilization - scores_before.utilization),
        ComponentDelta(component="Payment Reliability", before=scores_before.payment, after=scores_after.payment, delta=scores_after.payment - scores_before.payment),
        ComponentDelta(component="Debt Load (FOIR)", before=scores_before.foir, after=scores_after.foir, delta=scores_after.foir - scores_before.foir),
        ComponentDelta(component="Cash Flow", before=scores_before.cash_flow, after=scores_after.cash_flow, delta=scores_after.cash_flow - scores_before.cash_flow),
        ComponentDelta(component="Emergency Fund", before=scores_before.emergency, after=scores_after.emergency, delta=scores_after.emergency - scores_before.emergency),
        ComponentDelta(component="Credit Age & Mix", before=scores_before.age_mix, after=scores_after.age_mix, delta=scores_after.age_mix - scores_before.age_mix),
    ]

    # 6. Money Facts
    new_u_pct = (utilization_ratio(new_state.revolving_used, new_state.revolving_limit) * Decimal("100")).quantize(Decimal("0.1"))
    money_facts: List[MoneyFact] = [
        MoneyFact(label="Amount Paid", value=format_inr(actual_paid), raw=actual_paid),
        MoneyFact(label="New Balance", value=format_inr(target_acc.balance if target_acc else Decimal("0")), raw=target_acc.balance if target_acc else Decimal("0")),
        MoneyFact(label="New Utilization", value=f"{new_u_pct}%", raw=new_u_pct),
        MoneyFact(label="New Emergency Fund", value=format_inr(new_state.emergency_fund), raw=new_state.emergency_fund),
    ]

    # 7. Guard-Rails and Closed-Form Counter-Proposal
    guard_rails: List[GuardRail] = []
    has_emergency_breach = False

    if from_savings and coverage_after < EMERGENCY_FLOOR_MONTHS:
        has_emergency_breach = True
        
        # Closed-form solution for maximum safe payment:
        # X_max = (fund - FLOOR * (other_expenses + obligations)) / (1 - FLOOR * MIN_PAYMENT_RATE)
        fund = state.emergency_fund
        floor = EMERGENCY_FLOOR_MONTHS
        expenses = state.other_expenses
        obligations = state.total_obligations

        numerator = fund - floor * (expenses + obligations)
        denominator = Decimal("1") - (floor * MIN_PAYMENT_RATE)

        if denominator > Decimal("0"):
            x_max_exact = numerator / denominator
        else:
            x_max_exact = Decimal("0")

        # Floor down to nearest 100
        if x_max_exact > Decimal("0"):
            x_max_rounded = (x_max_exact / Decimal("100")).quantize(Decimal("1"), rounding=ROUND_FLOOR) * Decimal("100")
            x_max_clamped = min(x_max_rounded, pay_amount)
            suggestion_text = f"Pay {format_inr(x_max_clamped)} instead — same direction, and you keep {EMERGENCY_FLOOR_MONTHS} months of runway."
        else:
            x_max_clamped = Decimal("0")
            suggestion_text = f"Your emergency fund is already below {EMERGENCY_FLOOR_MONTHS} months of expenses. Avoid paying debt from emergency savings."

        guard_rails.append(GuardRail(
            code="EMERGENCY_FUND_BREACH",
            severity="warning",
            message=f"Emergency fund drops from {coverage_before:.1f} to {coverage_after:.1f} months of expenses (below the recommended {EMERGENCY_FLOOR_MONTHS} months floor).",
            suggestion=suggestion_text,
        ))

    # 8. Verdict
    score_delta = scores_after.overall - scores_before.overall
    if score_delta > 0 and not has_emergency_breach:
        verdict = "good"
    elif score_delta > 0 and has_emergency_breach:
        verdict = "caution"
    else:
        verdict = "bad"

    headline = (
        f"Paying {format_inr(actual_paid)} increases your credit health by {score_delta} points ({scores_before.overall} → {scores_after.overall})."
        if score_delta >= 0 else
        f"Paying {format_inr(actual_paid)} changes your score to {scores_after.overall}."
    )

    return ScenarioResult(
        kind="pay_debt",
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
