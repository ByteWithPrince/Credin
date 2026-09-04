from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import date, datetime
from uuid import UUID

class CreditAccountBase(BaseModel):
    type: Literal['credit_card', 'loan', 'bnpl', 'emi']
    balance: float = Field(..., ge=0)
    credit_limit: float = Field(..., ge=0)
    interest_rate: float = Field(..., ge=0)
    opened_date: Optional[date] = None
    status: str = 'active'
    min_payment: float = Field(..., ge=0)

class CreditAccount(CreditAccountBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class IncomeSourceBase(BaseModel):
    name: str
    monthly_amount: float = Field(..., ge=0)
    frequency: str = 'monthly'

class IncomeSource(IncomeSourceBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class RecurringExpenseBase(BaseModel):
    category: Literal['rent', 'utility', 'subscription', 'emi']
    name: str
    amount: float = Field(..., ge=0)
    due_date: Optional[date] = None

class RecurringExpense(RecurringExpenseBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class FinancialProfileBase(BaseModel):
    credit_health_score: int = Field(0, ge=0, le=100)
    debt_load_score: int = Field(0, ge=0, le=100)
    cash_flow_score: int = Field(0, ge=0, le=100)
    emergency_fund_score: int = Field(0, ge=0, le=100)
    payment_reliability_score: int = Field(0, ge=0, le=100)
    utilization_score: int = Field(0, ge=0, le=100)
    overall_health_score: int = Field(0, ge=0, le=100)
    
    total_available_credit: float = 0
    total_used_credit: float = 0
    monthly_income: float = 0
    monthly_obligations: float = 0
    emergency_fund: float = 0

class FinancialProfile(FinancialProfileBase):
    id: UUID
    user_id: UUID
    updated_at: datetime

    class Config:
        from_attributes = True
