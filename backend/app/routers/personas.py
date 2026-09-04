"""
Personas API router.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_session
from app.services.personas import PERSONAS, build_state, PERSONAS_BUILDERS
from app.services.health_score import compute_scores
from app.models.mapper import to_financial_state

router = APIRouter(prefix="/personas", tags=["personas"])


@router.get("", response_model=List[Dict[str, Any]])
def list_personas():
    """Returns the 3 seeded demo personas with preview health scores."""
    return PERSONAS


@router.get("/{persona_id}/state")
def get_persona_state(persona_id: str, session: Session = Depends(get_session)):
    """Returns full financial state and component scores for a persona."""
    state = None
    try:
        state = to_financial_state(session, persona_id)
    except Exception:
        # Fallback to in-memory builder if DB unavailable
        pass

    if not state:
        if persona_id in PERSONAS_BUILDERS:
            state = build_state(persona_id)
        else:
            raise HTTPException(status_code=404, detail="Persona not found")

    scores = compute_scores(state)

    return {
        "state": state.model_dump(mode="json"),
        "scores": scores.model_dump(mode="json"),
    }
