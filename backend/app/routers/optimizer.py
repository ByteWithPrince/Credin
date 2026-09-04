"""
Optimizer API router.
"""

from decimal import Decimal
from typing import Optional, List, Union
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_session
from app.models.mapper import to_financial_state
from app.services.personas import build_state, PERSONAS_BUILDERS
from app.services.optimizer import (
    optimize,
    compare_all,
    OptimizerResult,
    StrategyType,
)

router = APIRouter(prefix="/optimize", tags=["optimizer"])


class OptimizeRequest(BaseModel):
    user_id: str
    monthly_budget: Decimal
    strategy: Optional[StrategyType] = None


@router.post("", response_model=Union[OptimizerResult, List[OptimizerResult]])
def run_optimization(request: OptimizeRequest, session: Session = Depends(get_session)):
    """Runs debt payoff optimization for a specific strategy or compares all four."""
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

    try:
        if request.strategy:
            return optimize(state, request.monthly_budget, request.strategy)
        else:
            return compare_all(state, request.monthly_budget)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
