from datetime import date
from decimal import Decimal
import pytest

from app.models.domain import Account, FinancialState, PaymentEvent
from app.services.health_score import (
    utilization_score,
    payment_score,
    foir_score,
    emergency_score,
    compute_scores,
)


def _make_state(
    used: Decimal = Decimal("0"),
    limit: Decimal = Decimal("100000"),
    income: Decimal = Decimal("100000"),
    rent: Decimal = Decimal("0"),
    emis: Decimal = Decimal("0"),
    expenses: Decimal = Decimal("0"),
    fund: Decimal = Decimal("0"),
) -> FinancialState:
    accs = []
    if limit > 0 or used > 0:
        accs.append(
            Account(
                id="acc1",
                kind="credit_card",
                issuer="Test",
                display_name="Card",
                balance=used,
                credit_limit=limit,
                interest_rate=Decimal("36.0"),
                opened_date=date(2020, 1, 1),
            )
        )
    if emis > 0:
        accs.append(
            Account(
                id="acc2",
                kind="unsecured_loan",
                issuer="TestLoan",
                display_name="Loan",
                balance=Decimal("100000"),
                interest_rate=Decimal("12.0"),
                emi=emis,
                opened_date=date(2021, 1, 1),
            )
        )

    return FinancialState(
        user_id="u_test",
        display_name="Test User",
        monthly_income=income,
        rent=rent,
        other_expenses=expenses,
        emergency_fund=fund,
        accounts=accs,
    )


def test_utilization_piecewise_boundaries():
    benchmarks = [
        (Decimal("10000"), Decimal("100000"), Decimal("100.0")),  # 0.10
        (Decimal("20000"), Decimal("100000"), Decimal("85.0")),   # 0.20
        (Decimal("30000"), Decimal("100000"), Decimal("70.0")),   # 0.30
        (Decimal("40000"), Decimal("100000"), Decimal("55.0")),   # 0.40
        (Decimal("50000"), Decimal("100000"), Decimal("40.0")),   # 0.50
        (Decimal("60000"), Decimal("100000"), Decimal("30.0")),   # 0.60
        (Decimal("75000"), Decimal("100000"), Decimal("15.0")),   # 0.75
        (Decimal("90000"), Decimal("100000"), Decimal("6.0")),    # 0.90
        (Decimal("100000"), Decimal("100000"), Decimal("0.0")),   # 1.00
    ]
    for used, limit, expected in benchmarks:
        st = _make_state(used=used, limit=limit)
        assert utilization_score(st) == expected


def test_foir_piecewise_boundaries():
    benchmarks = [
        (Decimal("30000"), Decimal("100.0")),  # 0.30
        (Decimal("40000"), Decimal("70.0")),   # 0.40
        (Decimal("45000"), Decimal("50.0")),   # 0.45
        (Decimal("50000"), Decimal("30.0")),   # 0.50
        (Decimal("65000"), Decimal("0.0")),    # 0.65
    ]
    for obligations, expected in benchmarks:
        st = _make_state(income=Decimal("100000"), rent=obligations)
        assert foir_score(st) == expected


def test_emergency_piecewise_boundaries():
    st_6m = _make_state(income=Decimal("100000"), rent=Decimal("10000"), fund=Decimal("60000"))
    assert emergency_score(st_6m) == Decimal("100.0")

    st_3m = _make_state(income=Decimal("100000"), rent=Decimal("10000"), fund=Decimal("30000"))
    assert pytest.approx(float(emergency_score(st_3m)), abs=0.1) == 50.0

    st_0m = _make_state(income=Decimal("100000"), rent=Decimal("10000"), fund=Decimal("0"))
    assert emergency_score(st_0m) == Decimal("0.0")


def test_thin_file_payment_score():
    st = _make_state()
    assert payment_score(st) == Decimal("60.0")


def test_utilization_monotonicity():
    prev_score = Decimal("1000")
    for i in range(0, 121):
        u_ratio = Decimal(str(i)) / Decimal("100")
        used = u_ratio * Decimal("100000")
        st = _make_state(used=used, limit=Decimal("100000"))
        score = utilization_score(st)
        assert score <= prev_score
        prev_score = score


def test_foir_monotonicity():
    prev_score = Decimal("1000")
    for i in range(0, 81):
        f_ratio = Decimal(str(i)) / Decimal("100")
        ob = f_ratio * Decimal("100000")
        st = _make_state(income=Decimal("100000"), rent=ob)
        score = foir_score(st)
        assert score <= prev_score
        prev_score = score
