from datetime import date
from decimal import Decimal
import pytest
from app.models.domain import FinancialState, Account
from app.services.debt_optimizer import optimize, compare_all

@pytest.fixture
def multi_debt_state():
    card1 = Account(
        id="d1",
        kind="credit_card",
        issuer="Card High Rate",
        display_name="High APR Card",
        balance=Decimal("50000.00"),
        credit_limit=Decimal("100000.00"),
        interest_rate=Decimal("42.0"),
        opened_date=date(2022, 1, 1),
    )
    card2 = Account(
        id="d2",
        kind="credit_card",
        issuer="Card Small Bal",
        display_name="Small Balance Card",
        balance=Decimal("15000.00"),
        credit_limit=Decimal("50000.00"),
        interest_rate=Decimal("24.0"),
        opened_date=date(2023, 1, 1),
    )
    loan = Account(
        id="d3",
        kind="unsecured_loan",
        issuer="Personal Loan",
        display_name="Personal Loan",
        balance=Decimal("100000.00"),
        interest_rate=Decimal("12.0"),
        emi=Decimal("3500.00"),
        opened_date=date(2021, 6, 1),
    )
    return FinancialState(
        user_id="test-opt",
        display_name="Optimizer Test",
        monthly_income=Decimal("80000.00"),
        accounts=[card1, card2, loan]
    )

def test_avalanche_vs_snowball(multi_debt_state):
    budget = Decimal("15000.00")

    res_avalanche = optimize(multi_debt_state, budget, "avalanche")
    res_snowball = optimize(multi_debt_state, budget, "snowball")

    # Avalanche clears highest rate (42% -> 24% -> 12%)
    assert res_avalanche.payoff_order[0] == "High APR Card"

    # Snowball clears smallest balance (15k -> 50k -> 100k)
    assert res_snowball.payoff_order[0] == "Small Balance Card"

    # Mathematical guarantee: Avalanche total interest <= Snowball total interest
    assert res_avalanche.total_interest_paid <= res_snowball.total_interest_paid

    # Both clear within reasonable time
    assert res_avalanche.months_to_debt_free < 24
    assert res_snowball.months_to_debt_free < 24

def test_timeline_monotonicity(multi_debt_state):
    budget = Decimal("12000.00")
    res = optimize(multi_debt_state, budget, "avalanche")

    prev_bal = Decimal("999999999")
    for row in res.monthly_timeline:
        assert row["total_balance"] <= prev_bal
        prev_bal = row["total_balance"]

def test_budget_below_minimums(multi_debt_state):
    # Total min payments ~ 5% of (50k+15k) + 3500 = 3250 + 3500 = 6750
    with pytest.raises(ValueError, match="below total minimum required payments"):
        optimize(multi_debt_state, Decimal("2000.00"), "avalanche")

def test_compare_all_strategies(multi_debt_state):
    results = compare_all(multi_debt_state, Decimal("15000.00"))
    assert len(results) == 4
    # Highest interest strategy has 0 savings, best strategy has > 0 savings
    assert any(r.interest_saved_vs_worst > Decimal("0.00") for r in results)
