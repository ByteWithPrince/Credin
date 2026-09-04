"""
Scenario 2: Close a Credit Card.
Key bureau dynamic:
- Closing a card does NOT erase its balance.
- Total credit limit drops while used credit stays constant -> Utilization rises!
- Closed card still counts toward credit age and min payments.
"""

from copy import deepcopy
from datetime import date
from decimal import Decimal
from typing import List
from app.models.domain import FinancialState
from app.services.health_score import compute_scores
from app.services.financial_math import utilization_ratio
from app.services.scenarios.base import ScenarioResult, GuardRail, MoneyFact, ComponentDelta, format_inr


def simulate_close_card(
    state: FinancialState,
    account_id: str
) -> ScenarioResult:
    """
    Simulates closing an existing credit card.
    """
    scores_before = compute_scores(state)

    # 1. Deep copy state
    new_state = deepcopy(state)

    # 2. Mark card as closed
    target_acc = next((acc for acc in new_state.accounts if acc.id == account_id), None)
    if not target_acc:
        # Fallback to first revolving card
        target_acc = next((acc for acc in new_state.accounts if acc.is_revolving), None)

    card_name = "Credit Card"
    lost_limit = Decimal("0.00")
    if target_acc:
        card_name = target_acc.display_name
        lost_limit = target_acc.credit_limit or Decimal("0.00")
        target_acc.closed_date = date.today()

    # 3. Recompute scores
    scores_after = compute_scores(new_state)

    # 4. Deltas
    deltas: List[ComponentDelta] = [
        ComponentDelta(component="Utilization", before=scores_before.utilization, after=scores_after.utilization, delta=scores_after.utilization - scores_before.utilization),
        ComponentDelta(component="Payment Reliability", before=scores_before.payment, after=scores_after.payment, delta=scores_after.payment - scores_before.payment),
        ComponentDelta(component="Debt Load (FOIR)", before=scores_before.foir, after=scores_after.foir, delta=scores_after.foir - scores_before.foir),
        ComponentDelta(component="Cash Flow", before=scores_before.cash_flow, after=scores_after.cash_flow, delta=scores_after.cash_flow - scores_before.cash_flow),
        ComponentDelta(component="Emergency Fund", before=scores_before.emergency, after=scores_after.emergency, delta=scores_after.emergency - scores_before.emergency),
        ComponentDelta(component="Credit Age & Mix", before=scores_before.age_mix, after=scores_after.age_mix, delta=scores_after.age_mix - scores_before.age_mix),
    ]

    # 5. Money Facts
    old_u_pct = (utilization_ratio(state.revolving_used, state.revolving_limit) * Decimal("100")).quantize(Decimal("0.1"))
    new_u_pct = (utilization_ratio(new_state.revolving_used, new_state.revolving_limit) * Decimal("100")).quantize(Decimal("0.1"))

    money_facts: List[MoneyFact] = [
        MoneyFact(label="Lost Credit Limit", value=format_inr(lost_limit), raw=lost_limit),
        MoneyFact(label="Previous Utilization", value=f"{old_u_pct}%", raw=old_u_pct),
        MoneyFact(label="New Utilization", value=f"{new_u_pct}%", raw=new_u_pct),
        MoneyFact(label="Total Available Limit", value=format_inr(new_state.revolving_limit), raw=new_state.revolving_limit),
    ]

    # 6. Guard-Rails
    guard_rails: List[GuardRail] = []
    if scores_after.overall < scores_before.overall:
        guard_rails.append(GuardRail(
            code="UTILIZATION_SPIKE_RISK",
            severity="warning",
            message=f"Closing {card_name} removes {format_inr(lost_limit)} of credit limit, causing utilization to jump from {old_u_pct}% to {new_u_pct}%.",
            suggestion="Keep the card open with zero balance to preserve your credit limit and score.",
        ))

    score_delta = scores_after.overall - scores_before.overall
    verdict = "bad" if score_delta < 0 else "good"
    headline = f"Closing {card_name} decreases your score from {scores_before.overall} to {scores_after.overall} (utilization rises to {new_u_pct}%)."

    return ScenarioResult(
        kind="close_card",
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
