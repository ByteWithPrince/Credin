"""
Deterministic 6-component Financial Health Score Engine.
Pure Python, Decimal math only. The LLM never computes or adjusts these scores.
"""

from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

from app.models.domain import FinancialState, ComponentScores
from app.services.constants import (
    WEIGHTS,
    BANDS,
    SINGLE_CARD_DANGER,
    THIN_FILE_RELIABILITY,
    FULL_AGE_MONTHS,
)
from app.services.financial_math import (
    utilization_ratio,
    foir_ratio,
    surplus_ratio,
    months_of_coverage,
)

TWO_PLACES = Decimal("0.01")
ONE_PLACE = Decimal("0.1")


def utilization_score(state: FinancialState) -> Decimal:
    """
    Utilization score across revolving credit accounts (credit cards).
    Piecewise curve:
      U <= 0.10        -> 100
      0.10 < U <= 0.30 -> 100 - (U - 0.10) * 150
      0.30 < U <= 0.50 ->  70 - (U - 0.30) * 150
      0.50 < U <= 0.75 ->  40 - (U - 0.50) * 100
      U > 0.75         -> max(0, 15 - (U - 0.75) * 60)
    Then: if any single open card exceeds SINGLE_CARD_DANGER (90%), subtract 10 (floor 0).
    """
    if state.revolving_limit <= Decimal("0"):
        u = Decimal("0.00")
    else:
        u = utilization_ratio(state.revolving_used, state.revolving_limit)

    if u <= Decimal("0.10"):
        score = Decimal("100.0")
    elif u <= Decimal("0.30"):
        score = Decimal("100.0") - (u - Decimal("0.10")) * Decimal("150")
    elif u <= Decimal("0.50"):
        score = Decimal("70.0") - (u - Decimal("0.30")) * Decimal("150")
    elif u <= Decimal("0.75"):
        score = Decimal("40.0") - (u - Decimal("0.50")) * Decimal("100")
    else:
        score = max(Decimal("0.0"), Decimal("15.0") - (u - Decimal("0.75")) * Decimal("60"))

    # Single card danger penalty (-10 points)
    single_card_danger = False
    for a in state.open_accounts:
        if a.is_revolving and a.credit_limit and a.credit_limit > Decimal("0"):
            card_u = a.balance / a.credit_limit
            if card_u > SINGLE_CARD_DANGER:
                single_card_danger = True
                break

    if single_card_danger:
        score = max(Decimal("0.0"), score - Decimal("10.0"))

    return score.quantize(ONE_PLACE, rounding=ROUND_HALF_UP)


def payment_score(state: FinancialState) -> Decimal:
    """
    Payment reliability score based on trailing 12 months payment history.
    Thin file (no payment history) returns THIN_FILE_RELIABILITY (60).
    Base is 100, with cumulative deductions for DPD buckets:
      -40 if any 30+ DPD in last 3 months
      -20 if any 30+ DPD in months 4-12
      -60 if any 90+ DPD in last 12 months
    """
    if not state.payments:
        return THIN_FILE_RELIABILITY

    today = date.today()
    cutoff_12m = today - timedelta(days=365)
    cutoff_3m = today - timedelta(days=90)

    recent_payments = [p for p in state.payments if p.due_date >= cutoff_12m]
    if not recent_payments:
        return THIN_FILE_RELIABILITY

    base = Decimal("100.0")
    penalty = Decimal("0.0")
    has_30_last_3m = any(p for p in recent_payments if p.days_late >= 30 and p.due_date >= cutoff_3m)
    has_30_months_4_12 = any(p for p in recent_payments if p.days_late >= 30 and p.due_date < cutoff_3m)
    has_90_last_12m = any(p for p in recent_payments if p.days_late >= 90)

    if has_30_last_3m:
        penalty += Decimal("40.0")
    if has_30_months_4_12:
        penalty += Decimal("20.0")
    if has_90_last_12m:
        penalty += Decimal("60.0")

    score = max(Decimal("0.0"), base - penalty)
    return score.quantize(ONE_PLACE, rounding=ROUND_HALF_UP)


def foir_score(state: FinancialState) -> Decimal:
    """
    Debt load score based on Fixed Obligation to Income Ratio (FOIR).
    Piecewise curve:
      F <= 0.30        -> 100
      0.30 < F <= 0.40 -> 100 - (F - 0.30) * 300
      0.40 < F <= 0.50 ->  70 - (F - 0.40) * 400
      0.50 < F <= 0.65 -> max(0, 30 - (F - 0.50) * 200)
      F > 0.65         -> 0
    """
    f = foir_ratio(state.total_obligations, state.monthly_income)

    if f <= Decimal("0.30"):
        score = Decimal("100.0")
    elif f <= Decimal("0.40"):
        score = Decimal("100.0") - (f - Decimal("0.30")) * Decimal("300")
    elif f <= Decimal("0.50"):
        score = Decimal("70.0") - (f - Decimal("0.40")) * Decimal("400")
    elif f <= Decimal("0.65"):
        score = max(Decimal("0.0"), Decimal("30.0") - (f - Decimal("0.50")) * Decimal("200"))
    else:
        score = Decimal("0.0")

    return score.quantize(ONE_PLACE, rounding=ROUND_HALF_UP)


def cash_flow_score(state: FinancialState) -> Decimal:
    """
    Cash flow surplus score:
      S >= 0.30        -> 100
      0 <= S < 0.30    -> S * 333.33
      S < 0            -> 0
    """
    s = surplus_ratio(state.monthly_income, state.other_expenses, state.total_obligations)
    if s >= Decimal("0.30"):
        score = Decimal("100.0")
    elif s < Decimal("0.0"):
        score = Decimal("0.0")
    else:
        score = s * Decimal("333.3333333333333333333333333")

    return min(Decimal("100.0"), max(Decimal("0.0"), score)).quantize(ONE_PLACE, rounding=ROUND_HALF_UP)


def emergency_score(state: FinancialState) -> Decimal:
    """
    Emergency fund score based on runway coverage:
      M >= 6 -> 100
      else   -> min(100, M * 16.67)
    """
    m = months_of_coverage(state.emergency_fund, state.other_expenses, state.total_obligations)
    if m >= Decimal("6.0"):
        score = Decimal("100.0")
    elif m <= Decimal("0.0"):
        score = Decimal("0.0")
    else:
        score = min(Decimal("100.0"), m * Decimal("16.66666666666666666666666667"))

    return score.quantize(ONE_PLACE, rounding=ROUND_HALF_UP)


def age_mix_score(state: FinancialState) -> Decimal:
    """
    Credit age and account mix score:
      age = min(100, avg_account_age_months / FULL_AGE_MONTHS * 100)
      mix = 40 (1 type), 70 (2 types), 100 (3+ types)
      component = 0.7 * age + 0.3 * mix
    """
    avg_age = state.avg_account_age_months
    age_score = min(Decimal("100.0"), (avg_age / FULL_AGE_MONTHS) * Decimal("100.0"))

    types = state.distinct_account_types
    if types <= 1:
        mix_score = Decimal("40.0")
    elif types == 2:
        mix_score = Decimal("70.0")
    else:
        mix_score = Decimal("100.0")

    comp = Decimal("0.7") * age_score + Decimal("0.3") * mix_score
    return comp.quantize(ONE_PLACE, rounding=ROUND_HALF_UP)


def resolve_band(overall: int) -> str:
    for low, high, name in BANDS:
        if low <= overall <= high:
            return name
    return "Critical" if overall < 40 else "Strong"


def compute_scores(state: FinancialState) -> ComponentScores:
    """Computes all 6 component scores and weighted composite overall score."""
    u_sc = utilization_score(state)
    p_sc = payment_score(state)
    f_sc = foir_score(state)
    c_sc = cash_flow_score(state)
    e_sc = emergency_score(state)
    a_sc = age_mix_score(state)

    weighted_sum = (
        u_sc * Decimal(str(WEIGHTS["utilization"]))
        + p_sc * Decimal(str(WEIGHTS["payment"]))
        + f_sc * Decimal(str(WEIGHTS["foir"]))
        + c_sc * Decimal(str(WEIGHTS["cash_flow"]))
        + e_sc * Decimal(str(WEIGHTS["emergency"]))
        + a_sc * Decimal(str(WEIGHTS["age_mix"]))
    )

    overall_dec = (weighted_sum / Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    overall_int = int(overall_dec)
    band = resolve_band(overall_int)

    return ComponentScores(
        utilization=u_sc,
        payment=p_sc,
        foir=f_sc,
        cash_flow=c_sc,
        emergency=e_sc,
        age_mix=a_sc,
        overall=overall_int,
        band=band,
    )
