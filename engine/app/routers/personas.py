"""
FastAPI router for seeded demo personas.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.personas import PERSONAS, build_state
from app.services.health_score import compute_scores

router = APIRouter(prefix="/api/personas", tags=["Personas"])


@router.get("", response_model=List[Dict[str, Any]])
def list_personas():
    """Returns list of demo personas with summary scores."""
    result = []
    for p in PERSONAS:
        state = build_state(p["id"])
        scores = compute_scores(state)
        result.append({
            "id": p["id"],
            "name": p["name"],
            "tagline": p["tagline"],
            "monthly_income": str(p["monthly_income"]),
            "overall_score": scores.overall,
            "band": scores.band,
            "total_obligations": str(state.total_obligations),
        })
    return result


@router.get("/{persona_id}/state")
def get_persona_state(persona_id: str):
    """Returns full FinancialState and ComponentScores for a persona."""
    matching = next((p for p in PERSONAS if p["id"] == persona_id or p["name"].lower().startswith(persona_id.lower())), None)
    if not matching:
        raise HTTPException(status_code=404, detail="Persona not found")

    state = build_state(matching["id"])
    scores = compute_scores(state)

    return {
        "user_id": state.user_id,
        "display_name": state.display_name,
        "monthly_income": str(state.monthly_income),
        "rent": str(state.rent),
        "other_expenses": str(state.other_expenses),
        "emergency_fund": str(state.emergency_fund),
        "total_obligations": str(state.total_obligations),
        "revolving_used": str(state.revolving_used),
        "revolving_limit": str(state.revolving_limit),
        "scores": scores.model_dump(),
        "accounts": [
            {
                "id": acc.id,
                "kind": acc.kind,
                "issuer": acc.issuer,
                "display_name": acc.display_name,
                "last4": acc.last4,
                "balance": str(acc.balance),
                "credit_limit": str(acc.credit_limit) if acc.credit_limit is not None else None,
                "interest_rate": str(acc.interest_rate),
                "emi": str(acc.emi) if acc.emi is not None else None,
                "is_revolving": acc.is_revolving,
                "age_months": acc.age_months,
            }
            for acc in state.accounts
        ]
    }
