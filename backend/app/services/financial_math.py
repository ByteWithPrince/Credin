"""
Deterministic financial math primitives using decimal.Decimal.
Pure functions only — no I/O, no database dependencies, no float math for currency.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Optional

TWO_PLACES = Decimal("0.01")
FOUR_PLACES = Decimal("0.0001")


def _to_decimal(val: Any) -> Decimal:
    if isinstance(val, Decimal):
        return val
    return Decimal(str(val))


def _unrounded_emi(principal: Any, annual_rate_pct: Any, months: int) -> Decimal:
    p = _to_decimal(principal)
    rate = _to_decimal(annual_rate_pct)
    n = int(months)

    if n <= 0:
        return Decimal("0.0")

    if rate == Decimal("0"):
        return p / Decimal(n)

    r = rate / Decimal("1200")
    one_plus_r = Decimal("1") + r
    compound = one_plus_r ** n

    numerator = p * r * compound
    denominator = compound - Decimal("1")

    return numerator / denominator


def emi(principal: Any, annual_rate_pct: Any, months: int) -> Decimal:
    """
    Standard reducing-balance Equated Monthly Installment (EMI).
    r = annual_rate_pct / 12 / 100
    EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    If annual_rate_pct == 0, returns P / n exactly.
    Rounds to 2 decimal places using ROUND_HALF_UP.
    """
    val = _unrounded_emi(principal, annual_rate_pct, months)
    return val.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def total_interest(principal: Any, annual_rate_pct: Any, months: int) -> Decimal:
    """
    Total interest over the entire tenure.
    Computed as: unrounded_emi * months - principal.
    """
    p = _to_decimal(principal)
    rate = _to_decimal(annual_rate_pct)
    n = int(months)
    if n <= 0 or rate == Decimal("0"):
        return Decimal("0.00")
    exact_emi = _unrounded_emi(p, rate, n)
    tot = (exact_emi * Decimal(n)) - p
    return tot.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def amortization_schedule(principal: Any, annual_rate_pct: Any, months: int) -> List[Dict[str, Any]]:
    """
    Returns full monthly amortization schedule:
    {month, opening_balance, emi, interest_component, principal_component, closing_balance}
    Final closing_balance is guaranteed to be 0.00.
    """
    p = _to_decimal(principal)
    rate = _to_decimal(annual_rate_pct)
    n = int(months)
    if n <= 0:
        return []

    monthly_emi = emi(p, rate, n)
    r = rate / Decimal("1200") if rate > Decimal("0") else Decimal("0")

    schedule = []
    current_balance = p

    for m in range(1, n + 1):
        opening = current_balance
        if m == n:
            # Last month: absorb any tiny sub-paisa rounding drift
            interest_comp = (opening * r).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
            principal_comp = opening
            closing = Decimal("0.00")
            current_emi = (principal_comp + interest_comp).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        else:
            interest_comp = (opening * r).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
            principal_comp = monthly_emi - interest_comp
            closing = opening - principal_comp
            current_emi = monthly_emi
            current_balance = closing

        schedule.append({
            "month": m,
            "opening_balance": opening.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            "emi": current_emi,
            "interest_component": interest_comp,
            "principal_component": principal_comp.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            "closing_balance": closing.quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
        })

    return schedule




def months_to_payoff(balance: Any, annual_rate_pct: Any, monthly_payment: Any) -> Optional[int]:
    """
    Calculates the number of months to clear a debt given a fixed monthly payment.
    Returns None if payment does not cover the first month's interest (infinite loop).
    Caps iteration at 600 months (50 years).
    """
    bal = _to_decimal(balance)
    rate = _to_decimal(annual_rate_pct)
    pay = _to_decimal(monthly_payment)

    if bal <= Decimal("0"):
        return 0

    r = rate / Decimal("1200") if rate > Decimal("0") else Decimal("0")
    first_month_interest = (bal * r).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

    if pay <= first_month_interest:
        return None

    months_count = 0
    curr = bal
    while curr > Decimal("0") and months_count < 600:
        months_count += 1
        interest = (curr * r).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
        principal_paid = pay - interest
        curr -= principal_paid
        if curr <= Decimal("0"):
            break

    return months_count if months_count <= 600 else None


def utilization_ratio(used: Any, limit: Any) -> Decimal:
    """Revolving credit utilization ratio U = used / limit. Returns 0 if limit <= 0."""
    u = _to_decimal(used)
    lim = _to_decimal(limit)
    if lim <= Decimal("0"):
        return Decimal("0.00")
    return (u / lim).quantize(FOUR_PLACES, rounding=ROUND_HALF_UP)


def foir_ratio(total_obligations: Any, monthly_income: Any) -> Decimal:
    """FOIR ratio F = total_obligations / monthly_income. Returns 0 if income <= 0."""
    ob = _to_decimal(total_obligations)
    inc = _to_decimal(monthly_income)
    if inc <= Decimal("0"):
        return Decimal("0.00")
    return (ob / inc).quantize(FOUR_PLACES, rounding=ROUND_HALF_UP)


def surplus_ratio(income: Any, other_expenses: Any, obligations: Any) -> Decimal:
    """Cash flow surplus ratio S = (income - other_expenses - obligations) / income."""
    inc = _to_decimal(income)
    exp = _to_decimal(other_expenses)
    ob = _to_decimal(obligations)
    if inc <= Decimal("0"):
        return Decimal("0.00")
    surplus = inc - exp - ob
    return (surplus / inc).quantize(FOUR_PLACES, rounding=ROUND_HALF_UP)


def months_of_coverage(emergency_fund: Any, other_expenses: Any, obligations: Any) -> Decimal:
    """Emergency coverage M = emergency_fund / (other_expenses + obligations)."""
    ef = _to_decimal(emergency_fund)
    denom = _to_decimal(other_expenses) + _to_decimal(obligations)
    if denom <= Decimal("0"):
        return Decimal("0.00")
    return (ef / denom).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
