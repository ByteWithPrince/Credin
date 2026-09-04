"""
In-memory domain models for the CreditIn engine.
Pydantic v2 models — NOT database tables and NOT API response models.
All money fields use decimal.Decimal. Never float.
"""

from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal, Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.services.constants import MIN_PAYMENT_RATE

AccountKind = Literal["credit_card", "secured_loan", "unsecured_loan", "bnpl"]


class Account(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: str
    kind: AccountKind
    issuer: str
    display_name: str
    last4: Optional[str] = None
    balance: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    credit_limit: Optional[Decimal] = None  # None for term loans
    interest_rate: Decimal                  # annual percent
    min_payment: Optional[Decimal] = None
    emi: Optional[Decimal] = None
    opened_date: date
    closed_date: Optional[date] = None

    @property
    def is_revolving(self) -> bool:
        return self.kind == "credit_card"

    @property
    def age_months(self) -> int:
        today = date.today()
        months = (today.year - self.opened_date.year) * 12 + (today.month - self.opened_date.month)
        return max(0, months)


class PaymentEvent(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    account_id: str
    due_date: date
    paid_date: Optional[date] = None
    days_late: int = 0


class FinancialState(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    user_id: str
    display_name: str
    monthly_income: Decimal
    rent: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    other_expenses: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    emergency_fund: Decimal = Field(default_factory=lambda: Decimal("0.00"))
    accounts: List[Account] = Field(default_factory=list)
    payments: List[PaymentEvent] = Field(default_factory=list)

    @property
    def open_accounts(self) -> List[Account]:
        return [a for a in self.accounts if a.closed_date is None]

    @property
    def revolving_used(self) -> Decimal:
        """Sum of balances of all revolving credit accounts (closing a card does not erase its balance)."""
        used = sum((a.balance for a in self.accounts if a.is_revolving), Decimal("0.00"))
        return used

    @property
    def revolving_limit(self) -> Decimal:
        """Sum of credit limits of open revolving credit accounts."""
        lim = sum((a.credit_limit or Decimal("0.00") for a in self.open_accounts if a.is_revolving), Decimal("0.00"))
        return lim

    @property
    def total_min_payments(self) -> Decimal:
        """Sum of min_payments (or 5% of balance) for revolving accounts with balances."""
        total = Decimal("0.00")
        for a in self.accounts:
            if a.is_revolving and a.balance > Decimal("0.00"):
                if a.min_payment is not None:
                    total += a.min_payment
                else:
                    total += (a.balance * MIN_PAYMENT_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return total

    @property
    def total_emis(self) -> Decimal:
        """Sum of EMIs over open term loans."""
        total = Decimal("0.00")
        for a in self.open_accounts:
            if not a.is_revolving and a.emi is not None:
                total += a.emi
        return total

    @property
    def total_obligations(self) -> Decimal:
        """Total monthly obligations: EMIs + card minimums + rent."""
        return self.total_emis + self.total_min_payments + self.rent

    @property
    def distinct_account_types(self) -> int:
        """Number of distinct account kinds across accounts on file (closed accounts remain on bureau record)."""
        return len(set(a.kind for a in self.accounts))

    @property
    def avg_account_age_months(self) -> Decimal:
        """Average account age across all accounts (closed accounts remain on bureau record)."""
        if not self.accounts:
            return Decimal("0.0")
        total_months = sum(a.age_months for a in self.accounts)
        return Decimal(str(total_months)) / Decimal(str(len(self.accounts)))


class ComponentScores(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    utilization: Decimal
    payment: Decimal
    foir: Decimal
    cash_flow: Decimal
    emergency: Decimal
    age_mix: Decimal
    overall: int
    band: str
