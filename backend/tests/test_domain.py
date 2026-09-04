from datetime import date
from decimal import Decimal
from app.models.domain import Account, FinancialState


def test_domain_computed_properties():
    card1 = Account(
        id="c1",
        kind="credit_card",
        issuer="HDFC",
        display_name="HDFC Card",
        balance=Decimal("60000"),
        credit_limit=Decimal("200000"),
        interest_rate=Decimal("42.0"),
        opened_date=date(2022, 1, 1),
    )
    card2 = Account(
        id="c2",
        kind="credit_card",
        issuer="Axis",
        display_name="Axis Card",
        balance=Decimal("30000"),
        credit_limit=Decimal("100000"),
        interest_rate=Decimal("40.0"),
        opened_date=date(2023, 1, 1),
    )
    loan = Account(
        id="l1",
        kind="unsecured_loan",
        issuer="Bajaj",
        display_name="Personal Loan",
        balance=Decimal("200000"),
        interest_rate=Decimal("12.0"),
        emi=Decimal("10000"),
        opened_date=date(2023, 6, 1),
    )

    state = FinancialState(
        user_id="u1",
        display_name="Test User",
        monthly_income=Decimal("100000"),
        rent=Decimal("20000"),
        accounts=[card1, card2, loan],
    )

    assert state.revolving_used == Decimal("90000")
    assert state.revolving_limit == Decimal("300000")
    assert state.total_min_payments == Decimal("4500.00")
    assert state.total_emis == Decimal("10000.00")
    assert state.total_obligations == Decimal("34500.00")
    assert state.distinct_account_types == 2
    assert state.avg_account_age_months > 0
