"""
Improvement Plan API router.
Supports both /improve/plan and /api/improve/plan endpoints.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_session
from app.models.mapper import to_financial_state
from app.services.personas import build_state, PERSONAS_BUILDERS
from app.services.improvement_plan import generate_plan_for_state, generate_plan_from_dict

router = APIRouter(prefix="", tags=["improvement"])


class ImprovementRequest(BaseModel):
    user_id: Optional[str] = "persona-rohit"
    current_profile: Optional[Dict[str, Any]] = None


@router.post("/improve/plan")
@router.post("/api/improve/plan")
def get_improvement_plan(req: ImprovementRequest, session: Session = Depends(get_session)):
    """Generates a personalized credit score improvement plan."""
    # 1. If explicit profile dictionary is passed, check it first
    if req.current_profile:
        return generate_plan_from_dict(req.current_profile)

    # 2. Otherwise load state from DB or seeded persona
    user_id = req.user_id or "persona-rohit"
    state = None
    try:
        state = to_financial_state(session, user_id)
    except Exception:
        pass

    if not state:
        state = build_state(user_id)

    return generate_plan_for_state(state)
