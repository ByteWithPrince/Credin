import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db import engine, Base
from app.models.tables import (
    AppUser,
    CreditAccount,
    PaymentRecord,
    IncomeSource,
    RecurringExpense,
    FinancialProfile,
    Simulation,
)


def init_db():
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")


if __name__ == "__main__":
    init_db()
