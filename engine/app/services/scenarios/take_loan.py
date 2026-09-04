"""
Scenario 3: Take a New Loan.
Simulates new loan EMI, FOIR impact, and credit mix / age adjustment.
"""

from copy import deepcopy
from datetime import date
from decimal import Decimal
from typing import List, Literal
from app.models.domain import FinancialState, Account
from app.services.health_score import compute_scores
from app.services.financial_math import emi, total_interest, foir_ratio
from app.services.constants import FOIR_HEALTHY, FOIR_OVERLEVERAGED
from app.services.scenarios.base import ScenarioResult, GuardRail, MoneyFact, ComponentDelta, format_inr


def simulate_take_loan(
    state: FinancialState,
    principal: Decimal,
    annual_rate_pct: Decimal,
    tenure_months: int,
    kind: Literal["secured_loan", "unsecured_loan"] = "secured_loan",
    display_name: str = "New Loan",
    issuer: str = "Bank"
) -> ScenarioResult:
    """
    Simulates taking a new loan.
    """
    p = Decimal(str(principal))
    r = Decimal(str(annual_rate_pct))
    n = int(tenure_months)

    scores_before = compute_scores(state)
    monthly_emi = emi(p, r, n)
    interest_total = total_interest(p, r, n)

    # 1. Deep copy state
    new_state = deepcopy(state)

    # 2. Add new loan account
    new_loan = Account(
        id=f"new-loan-{len(new_state.accounts)+1}",
        kind=kind,
        issuer=issuer,
        display_name=display_name,
        balance=p,
        interest_rate=r,
        emi=monthly_emi,
        opened_date=date.today(),
    )
    new_state.accounts.append(new_loan)

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

    # 5. Money facts
    foir_after = (foir_ratio(new_state.total_obligations, new_state.monthly_income) * Decimal("100")).quantize(Decimal("0.1"))
    money_facts: List[MoneyFact] = [
        MoneyFact(label="New Monthly EMI", value=format_inr(monthly_emi), raw=monthly_emi),
        MoneyFact(label="Total Interest Payable", value=format_inr(interest_total), raw=interest_total),
        MoneyFact(label="New FOIR", value=f"{foir_after}%", raw=foir_after),
        MoneyFact(label="Total Fixed Obligations", value=format_inr(new_state.total_obligations), raw=new_state.total_obligations),
    ]

    # 6. Guard-Rails & FOIR warnings
    guard_rails: List[GuardRail] = []
    foir_ratio_val = foir_ratio(new_state.total_obligations, new_state.monthly_income)

    if foir_ratio_val > FOIR_OVERLEVERAGED:
        guard_rails.append(GuardRail(
            code="FOIR_OVERLEVERAGED_BREACH",
            severity="block",
            message=f"New FOIR reaches {foir_after}% (over the 50% critical limit). Lenders are likely to decline this loan.",
            suggestion="Reduce loan principal or choose a longer tenure to lower the monthly EMI.",
        ))
    elif foir_ratio_val > FOIR_HEALTHY:
        guard_rails.append(GuardRail(
            code="FOIR_ELEVATED",
            severity="warning",
            message=f"New FOIR rises to {foir_after}%, exceeding the 40% healthy benchmark.",
            suggestion="Consider paying off existing card balances to open up debt capacity.",
        ))

    score_delta = scores_after.overall - scores_before.overall
    if foir_ratio_val > FOIR_OVERLEVERAGED or score_delta < -15:
        verdict = "bad"
        headline = f"Taking this loan causes significant over-leverage (FOIR {foir_after}%), dropping score to {scores_after.overall} ({scores_after.band})."
    elif foir_ratio_val > FOIR_HEALTHY:
        verdict = "caution"
        headline = f"Taking this loan adds {format_inr(monthly_emi)}/mo in EMI obligations; score changes to {scores_after.overall}."
    else:
        verdict = "good"
        headline = f"Loan approved within healthy credit capacity ({format_inr(monthly_emi)}/mo EMI); score is {scores_after.overall} ({scores_after.band})."

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
