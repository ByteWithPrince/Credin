"""
SQLAlchemy 2.x table models for CreditIn.
All money columns are Numeric(14,2) — never Float.
"""

import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Numeric,
    Integer,
    Date,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Index,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from app.db import Base


class AppUser(Base):
    __tablename__ = "app_user"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=True)
    display_name = Column(String, nullable=False)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    accounts = relationship("CreditAccount", back_populates="user", cascade="all, delete-orphan")
    income_sources = relationship("IncomeSource", back_populates="user", cascade="all, delete-orphan")
    recurring_expenses = relationship("RecurringExpense", back_populates="user", cascade="all, delete-orphan")
    financial_profile = relationship("FinancialProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    simulations = relationship("Simulation", back_populates="user", cascade="all, delete-orphan")


class CreditAccount(Base):
    __tablename__ = "credit_account"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("app_user.id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(String, nullable=False)
    issuer = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    last4 = Column(String, nullable=True)
    balance = Column(Numeric(14, 2), nullable=False, default=0.00)
    credit_limit = Column(Numeric(14, 2), nullable=True)
    interest_rate = Column(Numeric(5, 2), nullable=False)
    min_payment = Column(Numeric(14, 2), nullable=True)
    emi = Column(Numeric(14, 2), nullable=True)
    opened_date = Column(Date, nullable=False)
    closed_date = Column(Date, nullable=True)
    status = Column(String, default="active")

    __table_args__ = (
        CheckConstraint("kind IN ('credit_card', 'secured_loan', 'unsecured_loan', 'bnpl')", name="check_account_kind"),
    )

    user = relationship("AppUser", back_populates="accounts")
    payments = relationship("PaymentRecord", back_populates="account", cascade="all, delete-orphan")


class PaymentRecord(Base):
    __tablename__ = "payment_record"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(String(36), ForeignKey("credit_account.id", ondelete="CASCADE"), nullable=False, index=True)
    due_date = Column(Date, nullable=False)
    paid_date = Column(Date, nullable=True)
    amount = Column(Numeric(14, 2), nullable=True)
    days_late = Column(Integer, default=0)

    account = relationship("CreditAccount", back_populates="payments")


class IncomeSource(Base):
    __tablename__ = "income_source"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("app_user.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    monthly_amount = Column(Numeric(14, 2), nullable=False)

    user = relationship("AppUser", back_populates="income_sources")


class RecurringExpense(Base):
    __tablename__ = "recurring_expense"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("app_user.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String, nullable=False)
    name = Column(String, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    due_day_of_month = Column(Integer, nullable=True)

    __table_args__ = (
        CheckConstraint("category IN ('rent', 'utility', 'subscription', 'other')", name="check_expense_category"),
        CheckConstraint("due_day_of_month BETWEEN 1 AND 31", name="check_due_day"),
    )

    user = relationship("AppUser", back_populates="recurring_expenses")


class FinancialProfile(Base):
    __tablename__ = "financial_profile"

    user_id = Column(String(36), ForeignKey("app_user.id", ondelete="CASCADE"), primary_key=True, index=True)
    emergency_fund = Column(Numeric(14, 2), default=0.00)
    scores = Column(JSON, nullable=False)
    computed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("AppUser", back_populates="financial_profile")


class Simulation(Base):
    __tablename__ = "simulation"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("app_user.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(String, nullable=True)
    kind = Column(String, nullable=False)
    input_params = Column(JSON, nullable=True)
    output = Column(JSON, nullable=True)
    score_before = Column(Integer, nullable=True)
    score_after = Column(Integer, nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("AppUser", back_populates="simulations")
