"""
Demo Personas for CreditIn.
Provides deterministic financial profiles for instant demoing without login.
Golden values:
- Rohit: Base score 66 (Fair), Obligations ₹35,246.95
- Priya: Base score 66 (Fair), Thin file, Obligations ₹12,900.00
- Arjun: Base score 97 (Strong), Obligations ₹40,500.00
"""

from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Any, List
from app.models.domain import FinancialState, Account, PaymentEvent


def _months_ago(n: int) -> date:
    """Returns a date approximately n months ago."""
    today = date.today()
    year = today.year
    month = today.month - n
    while month <= 0:
        month += 12
        year -= 1
    day = min(today.day, 28)
    return date(year, month, day)


def _generate_payment_history(account_id: str, months_count: int, late_records: List[Dict[str, Any]] = None) -> List[PaymentEvent]:
    """Generates monthly payment events trailing backwards from today."""
    events = []
    late_dict = {rec["months_ago"]: rec["days_late"] for rec in (late_records or [])}

    for m in range(1, months_count + 1):
        due = _months_ago(m)
        days_late = late_dict.get(m, 0)
        paid = due + timedelta(days=days_late) if days_late > 0 else due
        events.append(PaymentEvent(
            account_id=account_id,
            due_date=due,
            paid_date=paid,
            days_late=days_late,
        ))
    return events


PERSONAS: List[Dict[str, Any]] = [
    {
        "id": "persona-rohit",
        "name": "Rohit Sharma",
        "tagline": "28, Salaried · Overleveraged with multiple cards",
        "monthly_income": Decimal("72000.00"),
        "rent": Decimal("20000.00"),
        "other_expenses": Decimal("16000.00"),
        "emergency_fund": Decimal("179000.00"),
        "accounts": [
            {
                "id": "rohit-hdfc-regalia",
                "kind": "credit_card",
                "issuer": "HDFC Bank",
                "display_name": "HDFC Regalia",
                "last4": "4821",
                "balance": Decimal("62000.00"),
                "credit_limit": Decimal("200000.00"),
                "interest_rate": Decimal("42.0"),
                "months_ago": 68,
            },
            {
                "id": "rohit-axis-ace",
                "kind": "credit_card",
                "issuer": "Axis Bank",
                "display_name": "Axis Ace",
                "last4": "9032",
                "balance": Decimal("28000.00"),
                "credit_limit": Decimal("100000.00"),
                "interest_rate": Decimal("41.0"),
                "months_ago": 22,
            },
            {
                "id": "rohit-bajaj-pl",
                "kind": "unsecured_loan",
                "issuer": "Bajaj Finserv",
                "display_name": "Personal Loan",
                "last4": None,
                "balance": Decimal("500000.00"),
                "credit_limit": None,
                "interest_rate": Decimal("10.5"),
                "emi": Decimal("10746.95"),
                "months_ago": 14,
            },
        ],
        "late_payments": [
            {"account_id": "rohit-hdfc-regalia", "months_ago": 7, "days_late": 34}
        ]
    },
    {
        "id": "persona-priya",
        "name": "Priya Nair",
        "tagline": "24, First job · Thin file, entry-level credit",
        "monthly_income": Decimal("45000.00"),
        "rent": Decimal("12000.00"),
        "other_expenses": Decimal("9000.00"),
        "emergency_fund": Decimal("25000.00"),
        "accounts": [
            {
                "id": "priya-sbi-click",
                "kind": "credit_card",
                "issuer": "SBI Card",
                "display_name": "SBI SimplyCLICK",
                "last4": "1174",
                "balance": Decimal("18000.00"),
                "credit_limit": Decimal("50000.00"),
                "interest_rate": Decimal("43.0"),
                "months_ago": 8,
            }
        ],
        "late_payments": []  # Empty history -> Thin file (score = 60)
    },
    {
        "id": "persona-arjun",
        "name": "Arjun Mehta",
        "tagline": "35, Senior engineer · Prime credit profile",
        "monthly_income": Decimal("180000.00"),
        "rent": Decimal("0.00"),
        "other_expenses": Decimal("45000.00"),
        "emergency_fund": Decimal("450000.00"),
        "accounts": [
            {
                "id": "arjun-icici-sapphiro",
                "kind": "credit_card",
                "issuer": "ICICI Bank",
                "display_name": "ICICI Sapphiro",
                "last4": "6650",
                "balance": Decimal("35000.00"),
                "credit_limit": Decimal("300000.00"),
                "interest_rate": Decimal("40.0"),
                "months_ago": 110,
            },
            {
                "id": "arjun-amex-plat",
                "kind": "credit_card",
                "issuer": "American Express",
                "display_name": "Amex Platinum Travel",
                "last4": "3319",
                "balance": Decimal("15000.00"),
                "credit_limit": Decimal("200000.00"),
                "interest_rate": Decimal("38.0"),
                "months_ago": 60,
            },
            {
                "id": "arjun-hdfc-home",
                "kind": "secured_loan",
                "issuer": "HDFC Bank",
                "display_name": "Home Loan",
                "last4": None,
                "balance": Decimal("4200000.00"),
                "credit_limit": None,
                "interest_rate": Decimal("8.6"),
                "emi": Decimal("38000.00"),
                "months_ago": 48,
            }
        ],
        "late_payments": [] # 12 months all on-time
    }
]


def build_state(persona_id: str) -> FinancialState:
    """
    Constructs an in-memory FinancialState for a seeded persona.
    Zero database dependency — works even if DB is offline.
    """
    p = next((item for item in PERSONAS if item["id"] == persona_id or item["name"].lower().startswith(persona_id.lower())), None)
    if not p:
        p = PERSONAS[0]

    accounts: List[Account] = []
    payments: List[PaymentEvent] = []

    for acc_data in p["accounts"]:
        acc = Account(
            id=acc_data["id"],
            kind=acc_data["kind"],
            issuer=acc_data["issuer"],
            display_name=acc_data["display_name"],
            last4=acc_data.get("last4"),
            balance=acc_data["balance"],
            credit_limit=acc_data.get("credit_limit"),
            interest_rate=acc_data["interest_rate"],
            emi=acc_data.get("emi"),
            opened_date=_months_ago(acc_data["months_ago"]),
        )
        accounts.append(acc)

        # Generate payment events for credit cards if not thin file
        if p["id"] != "persona-priya":
            late_recs = [r for r in p.get("late_payments", []) if r["account_id"] == acc.id]
            payments.extend(_generate_payment_history(acc.id, 12, late_recs))

    return FinancialState(
        user_id=p["id"],
        display_name=p["name"],
        monthly_income=p["monthly_income"],
        rent=p["rent"],
        other_expenses=p["other_expenses"],
        emergency_fund=p["emergency_fund"],
        accounts=accounts,
        payments=payments,
    )
