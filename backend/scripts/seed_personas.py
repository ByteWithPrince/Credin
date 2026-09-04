import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from decimal import Decimal
from app.db import SessionLocal, engine, Base
from app.models.tables import (
    AppUser,
    CreditAccount,
    PaymentRecord,
    IncomeSource,
    RecurringExpense,
    FinancialProfile,
)
from app.services.personas import (
    ROHIT_ID,
    PRIYA_ID,
    ARJUN_ID,
    build_state,
)
from app.services.health_score import compute_scores


def seed_persona(session, persona_id: str):
    state = build_state(persona_id)
    scores = compute_scores(state)

    # Upsert user
    user = session.query(AppUser).filter(AppUser.id == persona_id).first()
    if not user:
        user = AppUser(id=persona_id, display_name=state.display_name, is_demo=True)
        session.add(user)
    else:
        user.display_name = state.display_name
        user.is_demo = True

    # Clear old related records
    session.query(IncomeSource).filter(IncomeSource.user_id == persona_id).delete()
    session.query(RecurringExpense).filter(RecurringExpense.user_id == persona_id).delete()
    session.query(FinancialProfile).filter(FinancialProfile.user_id == persona_id).delete()
    
    # Clear accounts and payments
    old_accounts = session.query(CreditAccount).filter(CreditAccount.user_id == persona_id).all()
    for a in old_accounts:
        session.query(PaymentRecord).filter(PaymentRecord.account_id == a.id).delete()
    session.query(CreditAccount).filter(CreditAccount.user_id == persona_id).delete()

    # Income
    session.add(IncomeSource(user_id=persona_id, name="Primary Income", monthly_amount=state.monthly_income))

    # Rent & expenses
    if state.rent > Decimal("0.00"):
        session.add(RecurringExpense(user_id=persona_id, category="rent", name="Apartment Rent", amount=state.rent, due_day_of_month=5))
    if state.other_expenses > Decimal("0.00"):
        session.add(RecurringExpense(user_id=persona_id, category="utility", name="Living Expenses", amount=state.other_expenses, due_day_of_month=10))

    # Profile
    session.add(
        FinancialProfile(
            user_id=persona_id,
            emergency_fund=state.emergency_fund,
            scores=scores.model_dump(mode="json"),
        )
    )

    # Accounts and payments
    for acc in state.accounts:
        db_acc = CreditAccount(
            id=acc.id,
            user_id=persona_id,
            kind=acc.kind,
            issuer=acc.issuer,
            display_name=acc.display_name,
            last4=acc.last4,
            balance=acc.balance,
            credit_limit=acc.credit_limit,
            interest_rate=acc.interest_rate,
            min_payment=acc.min_payment,
            emi=acc.emi,
            opened_date=acc.opened_date,
            closed_date=acc.closed_date,
        )
        session.add(db_acc)

    for p in state.payments:
        db_p = PaymentRecord(
            account_id=p.account_id,
            due_date=p.due_date,
            paid_date=p.paid_date,
            days_late=p.days_late,
        )
        session.add(db_p)

    session.commit()
    print(f"Seeded persona: {state.display_name} ({persona_id})")


def seed_all():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        for pid in [ROHIT_ID, PRIYA_ID, ARJUN_ID]:
            seed_persona(session, pid)
    finally:
        session.close()


if __name__ == "__main__":
    seed_all()
