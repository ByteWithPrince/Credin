"""
Deterministic 6-component Financial Health Score Engine.
All math strictly adheres to the authoritative AGENTS.md specification.
"""

from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from app.models.domain import FinancialState, ComponentScores
from app.services.financial_math import (
    utilization_ratio,
    foir_ratio,
    surplus_ratio,
    months_of_coverage
)
from app.services.constants import (
    WEIGHTS,
    BANDS,
    THIN_FILE_RELIABILITY,
    FULL_AGE_MONTHS,
    SINGLE_CARD_DANGER
)

ONE_PLACE = Decimal("0.1")
TWO_PLACES = Decimal("0.01")


def compute_utilization_score(state: FinancialState) -> Decimal:
    """
    Utilization score across revolving credit cards (weight = 25).
    """
    if state.revolving_limit <= Decimal("0"):
        # If no revolving limit exists, no active revolving debt penalty
        u = Decimal("0.00")
    else:
        u = utilization_ratio(state.revolving_used, state.revolving_limit)

    if u <= Decimal("0.10"):
        score = Decimal("100")
    elif u <= Decimal("0.30"):
        score = Decimal("100") - (u - Decimal("0.10")) * Decimal("150")
    elif u <= Decimal("0.50"):
        score = Decimal("70") - (u - Decimal("0.30")) * Decimal("150")
    elif u <= Decimal("0.75"):
        score = Decimal("40") - (u - Decimal("0.50")) * Decimal("100")
    else:
        score = max(Decimal("0"), Decimal("15") - (u - Decimal("0.75")) * Decimal("60"))

    # Single card danger penalty: -10 if any single card is > 90% utilized
    has_maxed_card = False
    for acc in state.open_accounts:
        if acc.is_revolving and acc.credit_limit and acc.credit_limit > Decimal("0"):
            card_u = acc.balance / acc.credit_limit
            if card_u > SINGLE_CARD_DANGER:
                has_maxed_card = True
                break

    if has_maxed_card:
        score = max(Decimal("0"), score - Decimal("10"))

    return score.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def compute_payment_score(state: FinancialState) -> Decimal:
    """
    Payment reliability score trailing 12 months (weight = 25).
    No payment history -> THIN_FILE_RELIABILITY (60).
    Base is 100, with cumulative DPD deductions:
      - 40 if any 30+ DPD in last 3 months
      - 20 if any 30+ DPD in months 4-12
      - 60 if any 90+ DPD in last 12 months
    """
    if not state.payments:
        return THIN_FILE_RELIABILITY

    today = date.today()
    one_year_ago = today - timedelta(days=365)
    three_months_ago = today - timedelta(days=90)

    trailing_payments = [p for p in state.payments if p.due_date >= one_year_ago]
    if not trailing_payments:
        return THIN_FILE_RELIABILITY

    base_score = Decimal("100.00")

    # Subtractions:
    has_30_dpd_last_3m = any(p.days_late >= 30 and p.due_date >= three_months_ago for p in trailing_payments)
    has_30_dpd_months_4_12 = any(p.days_late >= 30 and p.due_date < three_months_ago for p in trailing_payments)
    has_90_dpd_last_12m = any(p.days_late >= 90 for p in trailing_payments)

    deduction = Decimal("0")
    if has_30_dpd_last_3m:
        deduction += Decimal("40")
    if has_30_dpd_months_4_12:
        deduction += Decimal("20")
    if has_90_dpd_last_12m:
        deduction += Decimal("60")

    final_score = max(Decimal("0"), base_score - deduction)
    return final_score.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def compute_foir_score(state: FinancialState) -> Decimal:
    """
    Debt Load (FOIR) score: obligations / income (weight = 20).
    """
    if state.monthly_income <= Decimal("0"):
        return Decimal("0.00")

    f = foir_ratio(state.total_obligations, state.monthly_income)

    if f <= Decimal("0.30"):
        score = Decimal("100")
    elif f <= Decimal("0.40"):
        score = Decimal("100") - (f - Decimal("0.30")) * Decimal("300")
    elif f <= Decimal("0.50"):
        score = Decimal("70") - (f - Decimal("0.40")) * Decimal("400")
    elif f <= Decimal("0.65"):
        score = max(Decimal("0"), Decimal("30") - (f - Decimal("0.50")) * Decimal("200"))
    else:
        score = Decimal("0")

    return score.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def compute_cash_flow_score(state: FinancialState) -> Decimal:
    """
    Cash flow surplus score: (income - other_expenses - obligations) / income (weight = 12).
    """
    if state.monthly_income <= Decimal("0"):
        return Decimal("0.00")

    s = surplus_ratio(state.monthly_income, state.other_expenses, state.total_obligations)

    if s >= Decimal("0.30"):
        score = Decimal("100")
    elif s >= Decimal("0"):
        score = s * Decimal("333.33")
    else:
        score = Decimal("0")

    return min(Decimal("100"), score).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def compute_emergency_score(state: FinancialState) -> Decimal:
    """
    Emergency fund score: months of coverage (weight = 10).
    """
    m = months_of_coverage(state.emergency_fund, state.other_expenses, state.total_obligations)

    if m >= Decimal("6.0"):
        score = Decimal("100")
    else:
        score = min(Decimal("100"), m * Decimal("16.67"))

    return score.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def compute_age_mix_score(state: FinancialState) -> Decimal:
    """
    Credit age & mix score (weight = 8).
    Age component (70%) + Mix component (30%).
    """
    avg_age = state.avg_account_age_months
    age_score = min(Decimal("100"), (avg_age / FULL_AGE_MONTHS) * Decimal("100"))

    # Mix: 40 if 1 type, 70 if 2, 100 if 3+
    types_count = state.distinct_account_types
    if types_count <= 1:
        mix_score = Decimal("40")
    elif types_count == 2:
        mix_score = Decimal("70")
    else:
        mix_score = Decimal("100")

    final_score = Decimal("0.7") * age_score + Decimal("0.3") * mix_score
    return final_score.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def resolve_band(overall_score: int) -> str:
    """Resolves overall 0-100 score into band category."""
    for low, high, band_name in BANDS:
        if low <= overall_score <= high:
            return band_name
    return "Critical" if overall_score < 40 else "Strong"


def compute_scores(state: FinancialState) -> ComponentScores:
    """
    Computes all 6 deterministic components, overall score (0-100), and rating band.
    """
    u_score = compute_utilization_score(state)
    p_score = compute_payment_score(state)
    f_score = compute_foir_score(state)
    c_score = compute_cash_flow_score(state)
    e_score = compute_emergency_score(state)
    a_score = compute_age_mix_score(state)

    # Weighted sum:
    # Utilization 25, Payment 25, FOIR 20, Cash Flow 12, Emergency 10, Age & Mix 8
    weighted_sum = (
        u_score * Decimal(str(WEIGHTS["utilization"])) +
        p_score * Decimal(str(WEIGHTS["payment"])) +
        f_score * Decimal(str(WEIGHTS["foir"])) +
        c_score * Decimal(str(WEIGHTS["cash_flow"])) +
        e_score * Decimal(str(WEIGHTS["emergency"])) +
        a_score * Decimal(str(WEIGHTS["age_mix"]))
    ) / Decimal("100")

    overall_int = int(weighted_sum.quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    overall_clamped = max(0, min(100, overall_int))
    band = resolve_band(overall_clamped)

    return ComponentScores(
        utilization=u_score,
        payment=p_score,
        foir=f_score,
        cash_flow=c_score,
        emergency=e_score,
        age_mix=a_score,
        overall=overall_clamped,
        band=band,
    )
