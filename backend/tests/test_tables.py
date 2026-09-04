from sqlalchemy import inspect, create_engine
from app.db import Base
from app.models.tables import (
    AppUser,
    CreditAccount,
    PaymentRecord,
    IncomeSource,
    RecurringExpense,
    FinancialProfile,
    Simulation,
)


def test_table_models_have_user_id_or_account_id():
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=test_engine)
    user_models = [CreditAccount, IncomeSource, RecurringExpense, FinancialProfile, Simulation]
    for model in user_models:
        mapper = inspect(model)
        has_user_id = any(c.key == "user_id" for c in mapper.columns)
        assert has_user_id, f"Model {model.__name__} must have a user_id column"

    # Payment record is linked via account_id
    p_mapper = inspect(PaymentRecord)
    assert any(c.key == "account_id" for c in p_mapper.columns)
