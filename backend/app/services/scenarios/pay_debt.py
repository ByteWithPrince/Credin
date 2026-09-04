"""
Scenario: Pay Debt with Emergency Fund Guard-Rail and Counter-Proposal.
"""

from decimal import Decimal, ROUND_HALF_UP, ROUND_FLOOR
from typing import Optional

from app.models.domain import FinancialState
from app.services.constants import EMERGENCY_FLOOR_MONTHS, MIN_PAYMENT_RATE
from app.services.financial_math import (
    months_of_coverage,
    utilization_ratio,
    total_interest,
    months_to_payoff,
)
from app.services.health_score import compute_scores
from app.services.scenarios.base import (
    ScenarioResult,
    GuardRail,
    MoneyFact,
    ComponentDelta,
    format_inr,
)


def simulate_pay_debt(
    state: FinancialState,
    account_id: str,
    amount: Decimal,
    from_savings: bool = True,
) -> ScenarioResult:
    """
    Simulates paying down debt on a specific account, optionally from savings (emergency fund).
    Evaluates emergency runway guard-rails and computes a closed-form counter-proposal if breached.
    """
    scores_before = compute_scores(state)

    # 1. Deep copy
    new_state = state.model_copy(deep=True)
    target_account = next(
        (a for a in new_state.accounts if a.id == account_id or account_id.lower() in a.id.lower() or a.id.lower() in account_id.lower() or account_id.lower() in a.display_name.lower()),
        None
    )
    if not target_account:
        raise ValueError(f"Account {account_id} not found")

    old_balance = target_account.balance
    actual_payment = min(amount, old_balance)

    # 2. Reduce balance
    target_account.balance = max(Decimal("0.00"), old_balance - actual_payment)

    # 3. If from savings, reduce emergency fund
    if from_savings:
        new_state.emergency_fund = max(Decimal("0.00"), new_state.emergency_fund - actual_payment)

    # 4. Recompute scores
    scores_after = compute_scores(new_state)

    # 5. Component deltas
    deltas = []
    comp_names = ["utilization", "payment", "foir", "cash_flow", "emergency", "age_mix"]
    for c in comp_names:
        b = getattr(scores_before, c)
        a = getattr(scores_after, c)
        deltas.append(ComponentDelta(component=c, before=b, after=a, delta=a - b))

    # 6. Money facts
    u_ratio_pct = utilization_ratio(new_state.revolving_used, new_state.revolving_limit) * Decimal("100")
    
    # Interest saved calculation
    # Using 60-month horizon at current min payment
    rate = target_account.interest_rate
    interest_before = total_interest(old_balance, rate, 60)
    interest_after = total_interest(target_account.balance, rate, 60)
    interest_saved = max(Decimal("0.00"), interest_before - interest_after)

    money_facts = [
        MoneyFact(label="Payment amount", value=format_inr(actual_payment), raw=actual_payment),
        MoneyFact(label="New balance", value=format_inr(target_account.balance), raw=target_account.balance),
        MoneyFact(
            label="New credit utilization",
            value=f"{u_ratio_pct:.1f}%",
            raw=u_ratio_pct,
        ),
        MoneyFact(label="Interest saved (60-month horizon)", value=format_inr(interest_saved), raw=interest_saved),
    ]

    # 7. Guard-rail check
    guard_rails = []
    cov_before = months_of_coverage(state.emergency_fund, state.other_expenses, state.total_obligations)
    cov_after = months_of_coverage(new_state.emergency_fund, new_state.other_expenses, new_state.total_obligations)

    if from_savings and cov_after < EMERGENCY_FLOOR_MONTHS:
        # Closed form counter proposal:
        # X_max = (fund - FLOOR * (expenses + obligations)) / (1 - FLOOR * MIN_PAYMENT_RATE)
        fund = state.emergency_fund
        floor_val = EMERGENCY_FLOOR_MONTHS
        denom_coverage = state.other_expenses + state.total_obligations
        
        numerator = fund - floor_val * denom_coverage
        denominator = Decimal("1.0") - floor_val * MIN_PAYMENT_RATE
        
        x_max_raw = numerator / denominator
        # Floor X_max DOWN to the nearest 100
        x_max_hundred = (x_max_raw / Decimal("100")).quantize(Decimal("1"), rounding=ROUND_FLOOR) * Decimal("100")
        x_max = max(Decimal("0.00"), min(x_max_hundred, actual_payment))

        suggestion_text = None
        if x_max > Decimal("0.00"):
            suggestion_text = f"Pay {format_inr(x_max)} instead — same direction, and you keep 3.0 months of runway."
        else:
            suggestion_text = "Any payment from savings will breach your 3-month emergency floor."

        guard_rails.append(
            GuardRail(
                code="EMERGENCY_FUND_BREACH",
                severity="warning",
                message=f"Your emergency runway drops from {cov_before:.1f} to {cov_after:.1f} months, below the safe 3.0-month floor.",
                suggestion=suggestion_text,
            )
        )

    # 8. Verdict
    if scores_after.overall < scores_before.overall:
        verdict = "bad"
    elif guard_rails:
        verdict = "caution"
    else:
        verdict = "good"

    headline = (
        f"Paying {format_inr(actual_payment)} moves your health score from "
        f"{scores_before.overall} ({scores_before.band}) to {scores_after.overall} ({scores_after.band})."
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
