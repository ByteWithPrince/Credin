"""
Simulation router handling What-If scenarios.
"""

from decimal import Decimal
from typing import Literal, Union, Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_session
from app.models.mapper import to_financial_state
from app.models.tables import Simulation
from app.models.domain import AccountKind
from app.services.personas import build_state, PERSONAS_BUILDERS
from app.services.scenarios.base import ScenarioResult
from app.services.scenarios.pay_debt import simulate_pay_debt
from app.services.scenarios.close_card import simulate_close_card
from app.services.scenarios.take_loan import simulate_take_loan

from app.services.intent.llm import parse_intent
from app.services.intent.keyword import ParsedIntent
from app.services.explainer import explain

router = APIRouter(prefix="", tags=["simulation"])


class ParseQueryRequest(BaseModel):
    user_id: str
    query: str


@router.post("/parse", response_model=Optional[ParsedIntent])
def parse_natural_language_query(request: ParseQueryRequest, session: Session = Depends(get_session)):
    """Parses free-text financial what-if question into structured intent."""
    state = None
    try:
        state = to_financial_state(session, request.user_id)
    except Exception:
        pass

    if not state:
        if request.user_id in PERSONAS_BUILDERS:
            state = build_state(request.user_id)
        else:
            raise HTTPException(status_code=404, detail="User not found")

    return parse_intent(request.query, state)


class PayDebtRequest(BaseModel):
    kind: Literal["pay_debt"]
    user_id: str
    account_id: str
    amount: Decimal
    from_savings: bool = True


class CloseCardRequest(BaseModel):
    kind: Literal["close_card"]
    user_id: str
    account_id: str


class TakeLoanRequest(BaseModel):
    kind: Literal["take_loan"]
    user_id: str
    principal: Decimal
    annual_rate_pct: Decimal
    months: int
    kind_of_loan: AccountKind = "unsecured_loan"


SimulateRequest = Annotated[
    Union[PayDebtRequest, CloseCardRequest, TakeLoanRequest],
    Field(discriminator="kind"),
]


@router.post("/simulate", response_model=ScenarioResult)
def run_simulation(request: SimulateRequest, session: Session = Depends(get_session)):
    """Runs a structured financial what-if simulation."""
    # 1. Load state
    state = None
    try:
        state = to_financial_state(session, request.user_id)
    except Exception:
        pass

    if not state:
        if request.user_id in PERSONAS_BUILDERS:
            state = build_state(request.user_id)
        else:
            raise HTTPException(status_code=404, detail="User not found")

    # 2. Execute scenario
    try:
        if request.kind == "pay_debt":
            result = simulate_pay_debt(
                state=state,
                account_id=request.account_id,
                amount=request.amount,
                from_savings=request.from_savings,
            )
        elif request.kind == "close_card":
            result = simulate_close_card(
                state=state,
                account_id=request.account_id,
            )
        elif request.kind == "take_loan":
            result = simulate_take_loan(
                state=state,
                principal=request.principal,
                annual_rate_pct=request.annual_rate_pct,
                months=request.months,
                kind=request.kind_of_loan,
            )
        else:
            raise HTTPException(status_code=422, detail="Invalid scenario kind")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # 3. Attach narrative explanation prose
    result.explanation = explain(result, state)

    # 3. Optionally persist simulation record
    try:
        sim_record = Simulation(
            user_id=request.user_id,
            kind=request.kind,
            input_params=request.model_dump(mode="json"),
            output=result.model_dump(mode="json"),
            score_before=result.score_before,
            score_after=result.score_after,
            is_demo=True,
        )
        session.add(sim_record)
        session.commit()
    except Exception:
        # Do not fail API call if simulation logging fails
        pass

    return result


class DirectPayDebtRequest(BaseModel):
    user_id: str = "persona-rohit"
    account_id: str
    amount: Decimal
    from_savings: bool = True


class DirectCloseCardRequest(BaseModel):
    user_id: str = "persona-rohit"
    account_id: str


class DirectTakeLoanRequest(BaseModel):
    user_id: str = "persona-rohit"
    principal: Decimal
    annual_rate_pct: Decimal
    tenure_months: Optional[int] = None
    months: Optional[int] = 60
    kind: Optional[AccountKind] = "unsecured_loan"
    display_name: Optional[str] = "New Loan"


@router.post("/simulate/pay-debt", response_model=ScenarioResult)
def run_direct_pay_debt(req: DirectPayDebtRequest, session: Session = Depends(get_session)):
    sim_req = PayDebtRequest(
        kind="pay_debt",
        user_id=req.user_id,
        account_id=req.account_id,
        amount=req.amount,
        from_savings=req.from_savings,
    )
    return run_simulation(sim_req, session)


@router.post("/simulate/close-card", response_model=ScenarioResult)
def run_direct_close_card(req: DirectCloseCardRequest, session: Session = Depends(get_session)):
    sim_req = CloseCardRequest(
        kind="close_card",
        user_id=req.user_id,
        account_id=req.account_id,
    )
    return run_simulation(sim_req, session)


@router.post("/simulate/take-loan", response_model=ScenarioResult)
def run_direct_take_loan(req: DirectTakeLoanRequest, session: Session = Depends(get_session)):
    m = req.tenure_months or req.months or 60
    k = req.kind or "unsecured_loan"
    sim_req = TakeLoanRequest(
        kind="take_loan",
        user_id=req.user_id,
        principal=req.principal,
        annual_rate_pct=req.annual_rate_pct,
        months=m,
        kind_of_loan=k,
    )
    return run_simulation(sim_req, session)

