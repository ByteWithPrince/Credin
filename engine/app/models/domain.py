"""
In-memory domain models for the CreditIn engine.
These define the data shapes for calculation — pure Pydantic v2 with Decimal precision.
"""

from datetime import date
from decimal import Decimal
from typing import Literal, Optional, List
from pydantic import BaseModel, Field
from app.services.constants import MIN_PAYMENT_RATE

AccountKind = Literal["credit_card", "secured_loan", "unsecured_loan", "bnpl"]


class Account(BaseModel):
    id: str
    kind: AccountKind
    issuer: str
    display_name: str
    last4: Optional[str] = None
    balance: Decimal = Decimal("0.00")
    credit_limit: Optional[Decimal] = None      # None for term loans
    interest_rate: Decimal = Decimal("0.00")    # annual percent (e.g. 10.5 for 10.5%)
    min_payment: Optional[Decimal] = None
    emi: Optional[Decimal] = None
    opened_date: date
    closed_date: Optional[date] = None

    @property
    def is_revolving(self) -> bool:
        return self.kind == "credit_card"

    @property
    def is_open(self) -> bool:
        return self.closed_date is None

    @property
    def age_months(self) -> int:
        today = date.today()
        months = (today.year - self.opened_date.year) * 12 + (today.month - self.opened_date.month)
        return max(0, months)


class PaymentEvent(BaseModel):
    account_id: str
    due_date: date
    paid_date: Optional[date] = None
    days_late: int = 0


class FinancialState(BaseModel):
    user_id: str
    display_name: str
    monthly_income: Decimal
    rent: Decimal = Decimal("0.00")
    other_expenses: Decimal = Decimal("0.00")
    emergency_fund: Decimal = Decimal("0.00")
    accounts: List[Account] = Field(default_factory=list)
    payments: List[PaymentEvent] = Field(default_factory=list)

    @property
    def open_accounts(self) -> List[Account]:
        return [acc for acc in self.accounts if acc.is_open]

    @property
    def revolving_used(self) -> Decimal:
        """
        Total used revolving credit across ALL cards (open or closed with remaining balance).
        Closing a card does not erase its balance per AGENTS.md.
        """
        return sum((acc.balance for acc in self.accounts if acc.is_revolving), Decimal("0.00"))

    @property
    def revolving_limit(self) -> Decimal:
        """
        Total revolving credit limit across OPEN credit cards only.
        """
        return sum((acc.credit_limit for acc in self.open_accounts if acc.is_revolving and acc.credit_limit is not None), Decimal("0.00"))

    @property
    def total_min_payments(self) -> Decimal:
        """
        Total minimum payment across revolving accounts (5% of balance).
        Closed accounts with balance still require payments.
        """
        return sum((MIN_PAYMENT_RATE * acc.balance for acc in self.accounts if acc.is_revolving and acc.balance > Decimal("0")), Decimal("0.00"))

    @property
    def total_emis(self) -> Decimal:
        """
        Total EMI obligations from open term loans.
        """
        return sum((acc.emi for acc in self.open_accounts if not acc.is_revolving and acc.emi is not None), Decimal("0.00"))

    @property
    def total_obligations(self) -> Decimal:
        """
        Total fixed obligations: loan EMIs + card minimums + rent.
        """
        return self.total_emis + self.total_min_payments + self.rent

    @property
    def distinct_account_types(self) -> int:
        """
        Count of distinct account types (credit_card, secured_loan, unsecured_loan, bnpl).
        """
        types = {acc.kind for acc in self.open_accounts}
        return len(types)

    @property
    def avg_account_age_months(self) -> Decimal:
        """
        Average account age in months.
        Real bureaus keep closed accounts on file, so closed accounts still count toward age.
        """
        if not self.accounts:
            return Decimal("0.00")
        total_age = sum(acc.age_months for acc in self.accounts)
        return Decimal(str(total_age)) / Decimal(str(len(self.accounts)))


class ComponentScores(BaseModel):
    utilization: Decimal
    payment: Decimal
    foir: Decimal
    cash_flow: Decimal
    emergency: Decimal
    age_mix: Decimal
    overall: int
    band: str
