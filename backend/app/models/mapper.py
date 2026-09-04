"""
Mapper from DB tables to Pydantic FinancialState.
"""

from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session

from app.db import scoped_query
from app.models.tables import (
    AppUser,
    CreditAccount,
    PaymentRecord,
    IncomeSource,
    RecurringExpense,
    FinancialProfile,
)
from app.models.domain import Account, PaymentEvent, FinancialState


def to_financial_state(session: Session, user_id: str) -> Optional[FinancialState]:
    """
    Loads user rows from DB and constructs a Pydantic FinancialState.
    Must go through scoped_query for every model with user_id.
    """
    user = scoped_query(session, AppUser, user_id).first()
    if not user:
        return None

    # Income sum
    incomes = scoped_query(session, IncomeSource, user_id).all()
    monthly_income = sum((Decimal(str(i.monthly_amount)) for i in incomes), Decimal("0.00"))

    # Recurring expenses: rent and other
    expenses = scoped_query(session, RecurringExpense, user_id).all()
    rent = Decimal("0.00")
    other_expenses = Decimal("0.00")
    for exp in expenses:
        amt = Decimal(str(exp.amount))
        if exp.category == "rent":
            rent += amt
        else:
            other_expenses += amt

    # Emergency fund
    profile = scoped_query(session, FinancialProfile, user_id).first()
    emergency_fund = Decimal(str(profile.emergency_fund)) if profile and profile.emergency_fund else Decimal("0.00")

    # Accounts
    db_accounts = scoped_query(session, CreditAccount, user_id).all()
    accounts = []
    payments = []

    for acc in db_accounts:
        accounts.append(
            Account(
                id=str(acc.id),
                kind=acc.kind,
                issuer=acc.issuer,
                display_name=acc.display_name,
                last4=acc.last4,
                balance=Decimal(str(acc.balance)),
                credit_limit=Decimal(str(acc.credit_limit)) if acc.credit_limit is not None else None,
                interest_rate=Decimal(str(acc.interest_rate)),
                min_payment=Decimal(str(acc.min_payment)) if acc.min_payment is not None else None,
                emi=Decimal(str(acc.emi)) if acc.emi is not None else None,
                opened_date=acc.opened_date,
                closed_date=acc.closed_date,
            )
        )
        # Payments for this account
        db_payments = session.query(PaymentRecord).filter(PaymentRecord.account_id == acc.id).all()
        for p in db_payments:
            payments.append(
                PaymentEvent(
                    account_id=str(acc.id),
                    due_date=p.due_date,
                    paid_date=p.paid_date,
                    days_late=p.days_late,
                )
            )

    return FinancialState(
        user_id=str(user.id),
        display_name=user.display_name,
        monthly_income=monthly_income,
        rent=rent,
        other_expenses=other_expenses,
        emergency_fund=emergency_fund,
        accounts=accounts,
        payments=payments,
    )
