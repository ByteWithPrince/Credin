"""
FastAPI router for What-If Scenarios (Pay Debt, Close Card, Take Loan).
"""

from decimal import Decimal
from typing import Optional, Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.personas import build_state
from app.services.scenarios.pay_debt import simulate_pay_debt
from app.services.scenarios.close_card import simulate_close_card
from app.services.scenarios.take_loan import simulate_take_loan
from app.services.scenarios.base import ScenarioResult

router = APIRouter(prefix="/api/simulate", tags=["Simulate"])


class PayDebtRequest(BaseModel):
    user_id: str = "persona-rohit"
    account_id: str
    amount: Decimal
    from_savings: bool = True


class CloseCardRequest(BaseModel):
    user_id: str = "persona-rohit"
    account_id: str


class TakeLoanRequest(BaseModel):
    user_id: str = "persona-rohit"
    principal: Decimal
    annual_rate_pct: Decimal
    tenure_months: int
    kind: Literal["secured_loan", "unsecured_loan"] = "secured_loan"
    display_name: str = "New Loan"


@router.post("/pay-debt", response_model=ScenarioResult)
def run_pay_debt(req: PayDebtRequest):
    state = build_state(req.user_id)
    return simulate_pay_debt(
        state=state,
        account_id=req.account_id,
        amount=req.amount,
        from_savings=req.from_savings
    )


@router.post("/close-card", response_model=ScenarioResult)
def run_close_card(req: CloseCardRequest):
    state = build_state(req.user_id)
    return simulate_close_card(
        state=state,
        account_id=req.account_id
    )


@router.post("/take-loan", response_model=ScenarioResult)
def run_take_loan(req: TakeLoanRequest):
    state = build_state(req.user_id)
    return simulate_take_loan(
        state=state,
        principal=req.principal,
        annual_rate_pct=req.annual_rate_pct,
        tenure_months=req.tenure_months,
        kind=req.kind,
        display_name=req.display_name
    )
