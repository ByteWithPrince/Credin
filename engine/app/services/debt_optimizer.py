"""
Debt Payoff Optimizer.
Compares Avalanche, Snowball, Credit-Optimized, and Balanced strategies.
Calculates rollover acceleration, interest savings, and payoff timelines with Decimal precision.
"""

from copy import deepcopy
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Literal
from pydantic import BaseModel
from app.models.domain import FinancialState, Account
from app.services.health_score import compute_scores
from app.services.constants import MIN_PAYMENT_RATE

StrategyKind = Literal["avalanche", "snowball", "credit_optimized", "balanced"]
TWO_PLACES = Decimal("0.01")


class OptimizerResult(BaseModel):
    strategy: str
    months_to_debt_free: int
    total_interest_paid: Decimal
    payoff_order: List[str]
    monthly_timeline: List[Dict[str, Any]]
    score_at_completion: int
    interest_saved_vs_worst: Decimal


def _calculate_min_payment(acc: Account) -> Decimal:
    """Calculates required monthly minimum payment for an account."""
    if acc.balance <= Decimal("0"):
        return Decimal("0.00")
    if acc.is_revolving:
        # 5% of balance or min 100
        min_p = acc.balance * MIN_PAYMENT_RATE
        return min(acc.balance, max(Decimal("100.00"), min_p)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    else:
        return min(acc.balance, acc.emi or (acc.balance * Decimal("0.02"))).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def _sort_accounts(accounts: List[Account], strategy: StrategyKind) -> List[Account]:
    """Sorts debts in target priority order according to chosen strategy."""
    active_debts = [acc for acc in accounts if acc.balance > Decimal("0")]
    if not active_debts:
        return []

    if strategy == "avalanche":
        # Highest interest rate first
        return sorted(active_debts, key=lambda a: a.interest_rate, reverse=True)

    elif strategy == "snowball":
        # Smallest balance first
        return sorted(active_debts, key=lambda a: a.balance)

    elif strategy == "credit_optimized":
        # Highest utilization first for cards, then highest rate
        def util_key(a: Account):
            u = (a.balance / a.credit_limit) if (a.is_revolving and a.credit_limit and a.credit_limit > 0) else Decimal("0")
            return (a.is_revolving, u, a.interest_rate)
        return sorted(active_debts, key=util_key, reverse=True)

    else:  # balanced
        # 50% rate rank + 50% balance rank
        max_rate = max((a.interest_rate for a in active_debts), default=Decimal("1"))
        max_bal = max((a.balance for a in active_debts), default=Decimal("1"))
        def balanced_key(a: Account):
            norm_rate = a.interest_rate / max_rate if max_rate > 0 else Decimal("0")
            norm_bal_inv = Decimal("1") - (a.balance / max_bal if max_bal > 0 else Decimal("0"))
            return Decimal("0.5") * norm_rate + Decimal("0.5") * norm_bal_inv
        return sorted(active_debts, key=balanced_key, reverse=True)


def optimize(
    state: FinancialState,
    monthly_budget: Decimal,
    strategy: StrategyKind = "avalanche"
) -> OptimizerResult:
    """
    Simulates monthly debt payoff with payment rollover.
    """
    budget = Decimal(str(monthly_budget))
    accounts_copy = [deepcopy(acc) for acc in state.accounts if acc.balance > Decimal("0")]

    if not accounts_copy:
        return OptimizerResult(
            strategy=strategy,
            months_to_debt_free=0,
            total_interest_paid=Decimal("0.00"),
            payoff_order=[],
            monthly_timeline=[],
            score_at_completion=100,
            interest_saved_vs_worst=Decimal("0.00"),
        )

    # Initial minimums check
    total_initial_min = sum((_calculate_min_payment(acc) for acc in accounts_copy), Decimal("0.00"))
    if budget < total_initial_min:
        raise ValueError(f"Monthly budget ₹{budget:,.2f} is below total minimum required payments (₹{total_initial_min:,.2f}).")

    sorted_debts = _sort_accounts(accounts_copy, strategy)
    payoff_order_ids = [d.id for d in sorted_debts]
    debt_map = {d.id: d for d in sorted_debts}

    total_interest_accumulated = Decimal("0.00")
    cleared_order: List[str] = []
    monthly_timeline: List[Dict[str, Any]] = []

    months = 0
    while months < 600:
        active_debts = [debt_map[acc_id] for acc_id in payoff_order_ids if debt_map[acc_id].balance > Decimal("0")]
        if not active_debts:
            break

        months += 1
        month_interest = Decimal("0.00")

        # 1. Accrue monthly interest
        for acc in active_debts:
            r = (acc.interest_rate / Decimal("1200")) if acc.interest_rate > Decimal("0") else Decimal("0")
            acc_interest = (acc.balance * r).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
            acc.balance += acc_interest
            month_interest += acc_interest

        total_interest_accumulated += month_interest

        # 2. Pay minimums on all active debts
        available_pool = budget
        for acc in active_debts:
            min_req = _calculate_min_payment(acc)
            payment = min(acc.balance, min_req, available_pool)
            acc.balance -= payment
            available_pool -= payment

        # 3. Direct remaining snowball/avalanche rollover budget to target debt
        for target_id in payoff_order_ids:
            target = debt_map[target_id]
            if target.balance > Decimal("0") and available_pool > Decimal("0"):
                extra_pay = min(target.balance, available_pool)
                target.balance -= extra_pay
                available_pool -= extra_pay

            if target.balance <= Decimal("0") and target.display_name not in cleared_order:
                cleared_order.append(target.display_name)

        total_bal = sum((d.balance for d in active_debts if d.balance > Decimal("0")), Decimal("0.00"))
        monthly_timeline.append({
            "month": months,
            "total_balance": total_bal.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            "total_interest_paid_to_date": total_interest_accumulated.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
        })

    # Recompute hypothetical final score (all debts 0)
    debt_free_state = deepcopy(state)
    for acc in debt_free_state.accounts:
        acc.balance = Decimal("0.00")
    score_at_end = compute_scores(debt_free_state).overall

    return OptimizerResult(
        strategy=strategy,
        months_to_debt_free=months,
        total_interest_paid=total_interest_accumulated.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
        payoff_order=cleared_order,
        monthly_timeline=monthly_timeline,
        score_at_completion=score_at_end,
        interest_saved_vs_worst=Decimal("0.00"),
    )


def compare_all(state: FinancialState, monthly_budget: Decimal) -> List[OptimizerResult]:
    """
    Compares all four strategies and calculates savings versus the highest interest strategy.
    """
    strategies: List[StrategyKind] = ["avalanche", "snowball", "credit_optimized", "balanced"]
    results = [optimize(state, monthly_budget, strat) for strat in strategies]

    worst_interest = max((res.total_interest_paid for res in results), default=Decimal("0.00"))
    for res in results:
        res.interest_saved_vs_worst = max(Decimal("0.00"), worst_interest - res.total_interest_paid)

    return results
