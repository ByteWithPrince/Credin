"""
Deterministic Debt Payoff Optimizer (Avalanche, Snowball, Credit-Optimized, Balanced).
Pure Python simulation using decimal.Decimal.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Literal
from pydantic import BaseModel, ConfigDict

from app.models.domain import FinancialState, Account
from app.services.constants import MIN_PAYMENT_RATE
from app.services.health_score import compute_scores

StrategyType = Literal["avalanche", "snowball", "credit_optimized", "balanced"]


class MonthlyTimelinePoint(BaseModel):
    month: int
    total_balance: Decimal
    total_interest_paid_to_date: Decimal


class OptimizerResult(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    strategy: str
    months_to_debt_free: int
    total_interest_paid: Decimal
    payoff_order: List[str]
    monthly_timeline: List[MonthlyTimelinePoint]
    score_at_completion: int
    interest_saved_vs_worst: Decimal = Decimal("0.00")


def _get_min_payment(acc: Account) -> Decimal:
    if acc.is_revolving:
        if acc.min_payment is not None:
            return acc.min_payment
        return (acc.balance * MIN_PAYMENT_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    elif acc.emi is not None:
        return acc.emi
    return Decimal("0.00")


def _sort_debts(accounts: List[Account], strategy: StrategyType) -> List[Account]:
    debts = [a for a in accounts if a.balance > Decimal("0.00")]

    if strategy == "avalanche":
        # Highest interest rate first
        return sorted(debts, key=lambda a: a.interest_rate, reverse=True)

    elif strategy == "snowball":
        # Smallest balance first
        return sorted(debts, key=lambda a: a.balance)

    elif strategy == "credit_optimized":
        # Highest utilization first (revolving cards first, then highest rate loans)
        def sort_key(a: Account):
            if a.is_revolving and a.credit_limit and a.credit_limit > Decimal("0"):
                u = a.balance / a.credit_limit
                return (1, u, a.interest_rate)
            return (0, Decimal("0"), a.interest_rate)

        return sorted(debts, key=sort_key, reverse=True)

    elif strategy == "balanced":
        # Normalized rate (0-1) + normalized utilization (0-1)
        max_rate = max((a.interest_rate for a in debts), default=Decimal("1.0"))
        if max_rate <= Decimal("0"):
            max_rate = Decimal("1.0")

        def balanced_key(a: Account):
            norm_rate = a.interest_rate / max_rate
            norm_u = Decimal("0.0")
            if a.is_revolving and a.credit_limit and a.credit_limit > Decimal("0"):
                norm_u = a.balance / a.credit_limit
            return Decimal("0.5") * norm_rate + Decimal("0.5") * norm_u

        return sorted(debts, key=balanced_key, reverse=True)

    return debts


def optimize(
    state: FinancialState,
    monthly_budget: Decimal,
    strategy: StrategyType = "avalanche",
) -> OptimizerResult:
    """
    Runs a month-by-month debt payoff simulation using the specified payoff strategy.
    """
    debt_accounts = [a for a in state.open_accounts if a.balance > Decimal("0.00")]
    if not debt_accounts:
        # Already debt-free
        scores = compute_scores(state)
        return OptimizerResult(
            strategy=strategy,
            months_to_debt_free=0,
            total_interest_paid=Decimal("0.00"),
            payoff_order=[],
            monthly_timeline=[MonthlyTimelinePoint(month=0, total_balance=Decimal("0.00"), total_interest_paid_to_date=Decimal("0.00"))],
            score_at_completion=scores.overall,
            interest_saved_vs_worst=Decimal("0.00"),
        )

    # Calculate sum of initial minimum payments
    sum_initial_mins = sum((_get_min_payment(a) for a in debt_accounts), Decimal("0.00"))
    if monthly_budget < sum_initial_mins:
        raise ValueError(
            f"Monthly budget of ₹{monthly_budget:.2f} is below the minimum required payments of ₹{sum_initial_mins:.2f}"
        )

    # Prepare working state
    working_debts = [
        {
            "id": a.id,
            "display_name": a.display_name,
            "balance": a.balance,
            "rate": a.interest_rate,
            "is_revolving": a.is_revolving,
            "credit_limit": a.credit_limit,
            "fixed_emi": a.emi if not a.is_revolving else None,
        }
        for a in debt_accounts
    ]

    # Establish payoff order priority list
    sorted_accounts = _sort_debts(debt_accounts, strategy)
    priority_ids = [a.id for a in sorted_accounts]

    cleared_order = []
    total_interest_accum = Decimal("0.00")
    monthly_timeline = []

    init_balance = sum((d["balance"] for d in working_debts), Decimal("0.00"))
    monthly_timeline.append(
        MonthlyTimelinePoint(
            month=0,
            total_balance=init_balance,
            total_interest_paid_to_date=Decimal("0.00"),
        )
    )

    month = 0
    max_months = 600

    while month < max_months:
        active_debts = [d for d in working_debts if d["balance"] > Decimal("0.00")]
        if not active_debts:
            break

        month += 1
        # 1. Accrue monthly interest
        month_interest_total = Decimal("0.00")
        for d in active_debts:
            r = d["rate"] / Decimal("1200")
            monthly_interest = (d["balance"] * r).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            d["balance"] += monthly_interest
            month_interest_total += monthly_interest

        total_interest_accum += month_interest_total

        # 2. Pay mandatory minimums
        remaining_budget = monthly_budget
        for d in active_debts:
            if d["is_revolving"]:
                min_pay = (d["balance"] * MIN_PAYMENT_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                min_pay = max(Decimal("100.00"), min_pay)
            else:
                min_pay = d["fixed_emi"] or (d["balance"] * Decimal("0.05"))

            actual_min = min(d["balance"], min_pay)
            d["balance"] -= actual_min
            remaining_budget -= actual_min

        # 3. Direct remaining budget to priority target debt
        for pid in priority_ids:
            if remaining_budget <= Decimal("0.00"):
                break
            target = next((d for d in active_debts if d["id"] == pid and d["balance"] > Decimal("0.00")), None)
            if target:
                extra_pay = min(target["balance"], remaining_budget)
                target["balance"] -= extra_pay
                remaining_budget -= extra_pay

        # Check for newly cleared debts
        for pid in priority_ids:
            t = next((d for d in working_debts if d["id"] == pid), None)
            if t and t["balance"] == Decimal("0.00") and t["display_name"] not in cleared_order:
                cleared_order.append(t["display_name"])

        # Record timeline point
        current_total_bal = sum((d["balance"] for d in working_debts), Decimal("0.00"))
        monthly_timeline.append(
            MonthlyTimelinePoint(
                month=month,
                total_balance=current_total_bal.quantize(Decimal("0.01")),
                total_interest_paid_to_date=total_interest_accum.quantize(Decimal("0.01")),
            )
        )

    # Compute health score at completion
    final_state = state.model_copy(deep=True)
    for a in final_state.accounts:
        a.balance = Decimal("0.00")
    score_at_comp = compute_scores(final_state).overall

    return OptimizerResult(
        strategy=strategy,
        months_to_debt_free=month,
        total_interest_paid=total_interest_accum.quantize(Decimal("0.01")),
        payoff_order=cleared_order,
        monthly_timeline=monthly_timeline,
        score_at_completion=score_at_comp,
        interest_saved_vs_worst=Decimal("0.00"),
    )


def compare_all(state: FinancialState, monthly_budget: Decimal) -> List[OptimizerResult]:
    """Runs all 4 debt payoff strategies and computes interest savings vs worst."""
    strategies: List[StrategyType] = ["avalanche", "snowball", "credit_optimized", "balanced"]
    results = [optimize(state, monthly_budget, s) for s in strategies]

    worst_interest = max((r.total_interest_paid for r in results), default=Decimal("0.00"))
    for r in results:
        r.interest_saved_vs_worst = max(Decimal("0.00"), worst_interest - r.total_interest_paid)

    return results
