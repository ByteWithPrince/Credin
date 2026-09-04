from datetime import date
from decimal import Decimal
import pytest

from app.models.domain import Account, FinancialState
from app.services.optimizer import optimize, compare_all


def _make_multi_debt_fixture() -> FinancialState:
    d1 = Account(
        id="d1",
        kind="credit_card",
        issuer="BankA",
        display_name="High Rate Card",
        balance=Decimal("40000.00"),
        credit_limit=Decimal("100000.00"),
        interest_rate=Decimal("42.0"),
        opened_date=date(2022, 1, 1),
    )
    d2 = Account(
        id="d2",
        kind="credit_card",
        issuer="BankB",
        display_name="Small Balance Card",
        balance=Decimal("15000.00"),
        credit_limit=Decimal("50000.00"),
        interest_rate=Decimal("36.0"),
        opened_date=date(2023, 1, 1),
    )
    d3 = Account(
        id="d3",
        kind="unsecured_loan",
        issuer="BankC",
        display_name="Big Low Rate Loan",
        balance=Decimal("200000.00"),
        interest_rate=Decimal("12.0"),
        emi=Decimal("6000.00"),
        opened_date=date(2021, 1, 1),
    )

    return FinancialState(
        user_id="u_opt",
        display_name="Opt User",
        monthly_income=Decimal("80000.00"),
        rent=Decimal("15000.00"),
        accounts=[d1, d2, d3],
    )


def test_optimizer_avalanche_vs_snowball_order():
    state = _make_multi_debt_fixture()
    budget = Decimal("20000.00")

    res_avalanche = optimize(state, budget, "avalanche")
    res_snowball = optimize(state, budget, "snowball")

    # Avalanche clears highest rate first (High Rate Card @ 42%)
    assert res_avalanche.payoff_order[0] == "High Rate Card"

    # Snowball clears smallest balance first (Small Balance Card @ 15k)
    assert res_snowball.payoff_order[0] == "Small Balance Card"

    # Avalanche total interest must be <= snowball total interest
    assert res_avalanche.total_interest_paid <= res_snowball.total_interest_paid

    # Reaches debt free well under 600 months
    assert res_avalanche.months_to_debt_free < 600
    assert res_snowball.months_to_debt_free < 600

    # Total balance in timeline is monotonically non-increasing
    prev_bal = Decimal("10000000")
    for pt in res_avalanche.monthly_timeline:
        assert pt.total_balance <= prev_bal
        prev_bal = pt.total_balance


def test_optimizer_budget_too_low_raises():
    state = _make_multi_debt_fixture()
    # Minimums sum is > 8000
    with pytest.raises(ValueError):
        optimize(state, Decimal("1000.00"), "avalanche")


def test_compare_all():
    state = _make_multi_debt_fixture()
    results = compare_all(state, Decimal("25000.00"))
    assert len(results) == 4
    # Highest interest strategy has savings vs worst
    assert any(r.interest_saved_vs_worst > Decimal("0.00") for r in results)
