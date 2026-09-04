"""
Seeded demo personas for CreditIn.
Provides pure in-memory build_state() so the demo functions without database dependencies.
"""

from datetime import date
from decimal import Decimal
from typing import Dict, List, Any

from app.models.domain import Account, PaymentEvent, FinancialState
from app.services.health_score import compute_scores

ROHIT_ID = "00000000-0000-0000-0000-000000000001"
PRIYA_ID = "00000000-0000-0000-0000-000000000002"
ARJUN_ID = "00000000-0000-0000-0000-000000000003"


def _n_months_ago(n: int) -> date:
    today = date.today()
    total_months = today.year * 12 + today.month - 1 - n
    year = total_months // 12
    month = (total_months % 12) + 1
    day = min(today.day, 28)
    return date(year, month, day)


def get_rohit_state() -> FinancialState:
    acc_hdfc = Account(
        id="acc-rohit-hdfc",
        kind="credit_card",
        issuer="HDFC",
        display_name="HDFC Regalia",
        last4="4821",
        balance=Decimal("62000.00"),
        credit_limit=Decimal("200000.00"),
        interest_rate=Decimal("42.0"),
        opened_date=_n_months_ago(68),
    )
    acc_axis = Account(
        id="acc-rohit-axis",
        kind="credit_card",
        issuer="Axis",
        display_name="Axis Ace",
        last4="9032",
        balance=Decimal("28000.00"),
        credit_limit=Decimal("100000.00"),
        interest_rate=Decimal("41.0"),
        opened_date=_n_months_ago(22),
    )
    acc_bajaj = Account(
        id="acc-rohit-bajaj",
        kind="unsecured_loan",
        issuer="Bajaj",
        display_name="Personal Loan",
        last4=None,
        balance=Decimal("500000.00"),
        credit_limit=None,
        interest_rate=Decimal("10.5"),
        emi=Decimal("10746.95"),
        opened_date=_n_months_ago(14),
    )

    payments = []
    # 12 monthly records per card
    for m in range(1, 13):
        due = _n_months_ago(m)
        # HDFC card has 1 late payment 7 months ago with days_late = 34
        if m == 7:
            payments.append(PaymentEvent(account_id=acc_hdfc.id, due_date=due, days_late=34))
        else:
            payments.append(PaymentEvent(account_id=acc_hdfc.id, due_date=due, days_late=0))
        payments.append(PaymentEvent(account_id=acc_axis.id, due_date=due, days_late=0))

    return FinancialState(
        user_id=ROHIT_ID,
        display_name="Rohit Sharma",
        monthly_income=Decimal("72000.00"),
        rent=Decimal("20000.00"),
        other_expenses=Decimal("16000.00"),
        emergency_fund=Decimal("179000.00"),
        accounts=[acc_hdfc, acc_axis, acc_bajaj],
        payments=payments,
    )


def get_priya_state() -> FinancialState:
    acc_sbi = Account(
        id="acc-priya-sbi",
        kind="credit_card",
        issuer="SBI",
        display_name="SBI SimplyCLICK",
        last4="1174",
        balance=Decimal("18000.00"),
        credit_limit=Decimal("50000.00"),
        interest_rate=Decimal("43.0"),
        opened_date=_n_months_ago(8),
    )

    return FinancialState(
        user_id=PRIYA_ID,
        display_name="Priya Nair",
        monthly_income=Decimal("45000.00"),
        rent=Decimal("12000.00"),
        other_expenses=Decimal("9000.00"),
        emergency_fund=Decimal("25000.00"),
        accounts=[acc_sbi],
        payments=[],  # Thin file -> payment score 60
    )


def get_arjun_state() -> FinancialState:
    acc_icici = Account(
        id="acc-arjun-icici",
        kind="credit_card",
        issuer="ICICI",
        display_name="ICICI Sapphiro",
        last4="6650",
        balance=Decimal("35000.00"),
        credit_limit=Decimal("300000.00"),
        interest_rate=Decimal("40.0"),
        opened_date=_n_months_ago(110),
    )
    acc_amex = Account(
        id="acc-arjun-amex",
        kind="credit_card",
        issuer="Amex",
        display_name="Amex Platinum Travel",
        last4="3319",
        balance=Decimal("15000.00"),
        credit_limit=Decimal("200000.00"),
        interest_rate=Decimal("38.0"),
        opened_date=_n_months_ago(60),
    )
    acc_hdfc_home = Account(
        id="acc-arjun-home",
        kind="secured_loan",
        issuer="HDFC",
        display_name="Home Loan",
        last4=None,
        balance=Decimal("4200000.00"),
        credit_limit=None,
        interest_rate=Decimal("8.6"),
        emi=Decimal("38000.00"),
        opened_date=_n_months_ago(48),
    )

    payments = []
    for m in range(1, 13):
        due = _n_months_ago(m)
        payments.append(PaymentEvent(account_id=acc_icici.id, due_date=due, days_late=0))
        payments.append(PaymentEvent(account_id=acc_amex.id, due_date=due, days_late=0))

    return FinancialState(
        user_id=ARJUN_ID,
        display_name="Arjun Mehta",
        monthly_income=Decimal("180000.00"),
        rent=Decimal("0.00"),
        other_expenses=Decimal("45000.00"),
        emergency_fund=Decimal("450000.00"),
        accounts=[acc_icici, acc_amex, acc_hdfc_home],
        payments=payments,
    )


PERSONAS_BUILDERS = {
    ROHIT_ID: get_rohit_state,
    PRIYA_ID: get_priya_state,
    ARJUN_ID: get_arjun_state,
    "persona-rohit": get_rohit_state,
    "persona-priya": get_priya_state,
    "persona-arjun": get_arjun_state,
    "rohit": get_rohit_state,
    "priya": get_priya_state,
    "arjun": get_arjun_state,
}

PERSONAS: List[Dict[str, Any]] = [
    {
        "id": ROHIT_ID,
        "display_name": "Rohit Sharma",
        "age": 28,
        "occupation": "Salaried Software Engineer",
        "tagline": "28 · Salaried Engineer · ₹72k/mo · Fair Health",
        "overall_score": 66,
        "band": "Fair",
    },
    {
        "id": PRIYA_ID,
        "display_name": "Priya Nair",
        "age": 24,
        "occupation": "First Job, Thin File",
        "tagline": "24 · First Job · ₹45k/mo · Thin Credit File",
        "overall_score": 66,
        "band": "Fair",
    },
    {
        "id": ARJUN_ID,
        "display_name": "Arjun Mehta",
        "age": 35,
        "occupation": "Senior Tech Lead",
        "tagline": "35 · Senior Tech Lead · ₹1.8L/mo · Strong Health",
        "overall_score": 97,
        "band": "Strong",
    },
]


def build_state(persona_id: str) -> FinancialState:
    """Builds in-memory FinancialState for a demo persona without DB access."""
    builder = PERSONAS_BUILDERS.get(persona_id)
    if not builder:
        # Fallback to Rohit
        return get_rohit_state()
    return builder()
