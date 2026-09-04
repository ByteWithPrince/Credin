"""
FastAPI router for Debt Payoff Optimizer.
"""

from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.personas import build_state
from app.services.debt_optimizer import compare_all, optimize, OptimizerResult

router = APIRouter(prefix="/api/optimize", tags=["Optimizer"])


class OptimizeRequest(BaseModel):
    user_id: str = "persona-rohit"
    monthly_budget: Decimal
    strategy: Optional[str] = None


@router.post("", response_model=List[OptimizerResult])
def run_optimizer_comparison(req: OptimizeRequest):
    state = build_state(req.user_id)
    try:
        if req.strategy:
            return [optimize(state, req.monthly_budget, req.strategy)]  # type: ignore
        return compare_all(state, req.monthly_budget)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
