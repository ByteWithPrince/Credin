"""
Scenario: Close Credit Card Simulator.
Demonstrates the counterintuitive effect: balance stays owed, limit is removed, utilization rises, score drops.
"""

from datetime import date
from decimal import Decimal
from typing import Optional

from app.models.domain import FinancialState
from app.services.constants import UTILIZATION_TARGET
from app.services.financial_math import utilization_ratio
from app.services.health_score import compute_scores
from app.services.scenarios.base import (
    ScenarioResult,
    GuardRail,
    MoneyFact,
    ComponentDelta,
    format_inr,
)


def simulate_close_card(state: FinancialState, account_id: str) -> ScenarioResult:
    """
    Simulates closing a revolving credit card account.
    Balance remains owed, but limit is removed.
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

    if not target_account.is_revolving:
        raise ValueError(f"Account {account_id} is not a revolving credit card")

    # Invariants before closing
    u_ratio_before = utilization_ratio(state.revolving_used, state.revolving_limit)
    credit_limit_lost = target_account.credit_limit or Decimal("0.00")
    headroom_lost = max(Decimal("0.00"), credit_limit_lost - target_account.balance)

    # Find oldest account to check if closing oldest
    oldest_account = min(state.accounts, key=lambda a: a.opened_date) if state.accounts else None
    is_oldest = oldest_account and (oldest_account.id == account_id)

    # Count remaining open cards
    open_cards_before = [a for a in state.open_accounts if a.is_revolving]
    is_last_card = len(open_cards_before) <= 1

    # 2. Mark target account closed today
    target_account.closed_date = date.today()

    # 3. Recompute scores
    scores_after = compute_scores(new_state)

    # 4. Component deltas
    deltas = []
    comp_names = ["utilization", "payment", "foir", "cash_flow", "emergency", "age_mix"]
    for c in comp_names:
        b = getattr(scores_before, c)
        a = getattr(scores_after, c)
        deltas.append(ComponentDelta(component=c, before=b, after=a, delta=a - b))

    # 5. Money facts
    u_ratio_after = utilization_ratio(new_state.revolving_used, new_state.revolving_limit)
    u_pct_before = u_ratio_before * Decimal("100")
    u_pct_after = u_ratio_after * Decimal("100")

    money_facts = [
        MoneyFact(
            label="Credit utilization",
            value=f"{u_pct_before:.1f}% → {u_pct_after:.1f}%",
            raw=u_pct_after,
        ),
        MoneyFact(label="Credit limit removed", value=format_inr(credit_limit_lost), raw=credit_limit_lost),
        MoneyFact(label="Available headroom lost", value=format_inr(headroom_lost), raw=headroom_lost),
        MoneyFact(label="Remaining card balance (still owed)", value=format_inr(target_account.balance), raw=target_account.balance),
    ]

    # 6. Guard-rails
    guard_rails = []
    if is_last_card:
        guard_rails.append(
            GuardRail(
                code="LAST_CARD",
                severity="block",
                message="Closing your only remaining credit card eliminates your revolving credit mix and can severely damage credit history.",
            )
        )

    if is_oldest:
        guard_rails.append(
            GuardRail(
                code="OLDEST_ACCOUNT_CLOSED",
                severity="warning",
                message=f"This is your oldest account ({target_account.display_name}). Closing it will eventually impact your credit age once removed from bureau records.",
            )
        )

    if u_ratio_before <= UTILIZATION_TARGET and u_ratio_after > UTILIZATION_TARGET:
        guard_rails.append(
            GuardRail(
                code="UTILIZATION_THRESHOLD_CROSSED",
                severity="warning",
                message=f"Your overall credit utilization spikes from {u_pct_before:.1f}% to {u_pct_after:.1f}%, crossing the healthy 30% threshold.",
            )
        )

    # 7. Verdict
    if scores_after.overall < scores_before.overall:
        verdict = "bad"
    elif guard_rails:
        verdict = "caution"
    else:
        verdict = "good"

    headline = (
        f"Closing {target_account.display_name} reduces total credit limit, pushing utilization from "
        f"{u_pct_before:.1f}% to {u_pct_after:.1f}% and lowering your score by {abs(scores_after.overall - scores_before.overall)} points."
    )

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
