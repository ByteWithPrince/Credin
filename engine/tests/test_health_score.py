from datetime import date
from decimal import Decimal
import pytest
from app.models.domain import Account, FinancialState
from app.services.health_score import (
    compute_utilization_score,
    compute_payment_score,
    compute_foir_score,
    compute_cash_flow_score,
    compute_emergency_score,
    compute_age_mix_score,
    compute_scores
)

def make_base_state(
    used: Decimal = Decimal("0"),
    limit: Decimal = Decimal("100000"),
    obligations: Decimal = Decimal("0"),
    income: Decimal = Decimal("100000"),
    expenses: Decimal = Decimal("0"),
    emergency: Decimal = Decimal("0"),
) -> FinancialState:
    accounts = []
    if limit > Decimal("0") or used > Decimal("0"):
        accounts.append(
            Account(
                id="c1",
                kind="credit_card",
                issuer="HDFC",
                display_name="Card",
                balance=used,
                credit_limit=limit if limit > Decimal("0") else None,
                opened_date=date(2020, 1, 1),
            )
        )
    return FinancialState(
        user_id="test",
        display_name="Test User",
        monthly_income=income,
        rent=obligations, # uses rent as fixed obligation
        other_expenses=expenses,
        emergency_fund=emergency,
        accounts=accounts,
    )

def test_utilization_piecewise_boundaries():
    # U = 0.10 -> 100
    assert compute_utilization_score(make_base_state(used=Decimal("10000"), limit=Decimal("100000"))) == Decimal("100.00")
    # U = 0.20 -> 85
    assert compute_utilization_score(make_base_state(used=Decimal("20000"), limit=Decimal("100000"))) == Decimal("85.00")
    # U = 0.30 -> 70
    assert compute_utilization_score(make_base_state(used=Decimal("30000"), limit=Decimal("100000"))) == Decimal("70.00")
    # U = 0.40 -> 55
    assert compute_utilization_score(make_base_state(used=Decimal("40000"), limit=Decimal("100000"))) == Decimal("55.00")
    # U = 0.50 -> 40
    assert compute_utilization_score(make_base_state(used=Decimal("50000"), limit=Decimal("100000"))) == Decimal("40.00")
    # U = 0.60 -> 30
    assert compute_utilization_score(make_base_state(used=Decimal("60000"), limit=Decimal("100000"))) == Decimal("30.00")
    # U = 0.75 -> 15
    assert compute_utilization_score(make_base_state(used=Decimal("75000"), limit=Decimal("100000"))) == Decimal("15.00")
    # U = 0.90 -> 6 (15 - (0.90 - 0.75)*60 = 15 - 9 = 6)
    # Note: 90% without single card danger penalty (> 0.90 triggers danger)
    assert compute_utilization_score(make_base_state(used=Decimal("90000"), limit=Decimal("100000"))) == Decimal("6.00")
    # U = 1.00 -> 0 (with single card danger penalty)
    assert compute_utilization_score(make_base_state(used=Decimal("100000"), limit=Decimal("100000"))) == Decimal("0.00")

def test_foir_piecewise_boundaries():
    # F = 0.30 -> 100
    assert compute_foir_score(make_base_state(obligations=Decimal("30000"), income=Decimal("100000"))) == Decimal("100.00")
    # F = 0.40 -> 70
    assert compute_foir_score(make_base_state(obligations=Decimal("40000"), income=Decimal("100000"))) == Decimal("70.00")
    # F = 0.45 -> 50
    assert compute_foir_score(make_base_state(obligations=Decimal("45000"), income=Decimal("100000"))) == Decimal("50.00")
    # F = 0.50 -> 30
    assert compute_foir_score(make_base_state(obligations=Decimal("50000"), income=Decimal("100000"))) == Decimal("30.00")
    # F = 0.65 -> 0
    assert compute_foir_score(make_base_state(obligations=Decimal("65000"), income=Decimal("100000"))) == Decimal("0.00")

def test_emergency_piecewise_boundaries():
    # M = 6.0 -> 100
    assert compute_emergency_score(make_base_state(obligations=Decimal("50000"), emergency=Decimal("300000"))) == Decimal("100.00")
    # M = 3.0 -> 50.01 (3 * 16.67)
    assert compute_emergency_score(make_base_state(obligations=Decimal("50000"), emergency=Decimal("150000"))) == Decimal("50.01")
    # M = 0 -> 0
    assert compute_emergency_score(make_base_state(obligations=Decimal("50000"), emergency=Decimal("0"))) == Decimal("0.00")

def test_thin_file_payment_score():
    state = make_base_state()
    # No payment history at all -> exactly 60 (thin file)
    assert compute_payment_score(state) == Decimal("60.00")

def test_utilization_monotonicity():
    # Utilization score must be monotonically non-increasing from U=0.00 to 1.20
    prev_score = Decimal("100.00")
    limit = Decimal("100000")
    for step in range(0, 121):
        used = limit * Decimal(step) / Decimal("100")
        score = compute_utilization_score(make_base_state(used=used, limit=limit))
        assert score <= prev_score, f"Monotonicity failed at U={step/100}: {score} > {prev_score}"
        prev_score = score

def test_foir_monotonicity():
    # FOIR score must be monotonically non-increasing from F=0.00 to 0.80
    prev_score = Decimal("100.00")
    income = Decimal("100000")
    for step in range(0, 81):
        ob = income * Decimal(step) / Decimal("100")
        score = compute_foir_score(make_base_state(obligations=ob, income=income))
        assert score <= prev_score, f"Monotonicity failed at F={step/100}: {score} > {prev_score}"
        prev_score = score
