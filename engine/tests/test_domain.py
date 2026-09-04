from datetime import date
from decimal import Decimal
from app.models.domain import Account, FinancialState

def test_domain_computed_properties():
    # Two cards (60000/200000 and 30000/100000)
    card1 = Account(
        id="c1",
        kind="credit_card",
        issuer="HDFC",
        display_name="Regalia",
        balance=Decimal("60000"),
        credit_limit=Decimal("200000"),
        interest_rate=Decimal("36.0"),
        opened_date=date(2022, 1, 1),
    )
    card2 = Account(
        id="c2",
        kind="credit_card",
        issuer="Axis",
        display_name="Ace",
        balance=Decimal("30000"),
        credit_limit=Decimal("100000"),
        interest_rate=Decimal("42.0"),
        opened_date=date(2023, 1, 1),
    )
    # One term loan with emi 10000
    loan1 = Account(
        id="l1",
        kind="secured_loan",
        issuer="SBI",
        display_name="Auto Loan",
        balance=Decimal("400000"),
        interest_rate=Decimal("9.0"),
        emi=Decimal("10000"),
        opened_date=date(2021, 6, 1),
    )

    state = FinancialState(
        user_id="user-1",
        display_name="Test User",
        monthly_income=Decimal("100000"),
        rent=Decimal("20000"),
        other_expenses=Decimal("25000"),
        emergency_fund=Decimal("150000"),
        accounts=[card1, card2, loan1]
    )

    assert state.revolving_used == Decimal("90000")
    assert state.revolving_limit == Decimal("300000")
    assert state.total_min_payments == Decimal("4500.00") # 5% of 90000
    assert state.total_emis == Decimal("10000")
    assert state.total_obligations == Decimal("34500.00") # 10000 + 4500 + 20000
    assert state.distinct_account_types == 2
