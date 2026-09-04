"""
FastAPI router for user health scores.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.services.personas import PERSONAS, build_state
from app.services.health_score import compute_scores

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/{user_id}/score")
def get_user_score(user_id: str):
    """Returns the formatted score and component breakdown for the UI."""
    # Find matching persona or fallback to Rohit
    matching = next((p for p in PERSONAS if p["id"] == user_id or p["name"].lower().startswith(user_id.lower())), PERSONAS[0])

    state = build_state(matching["id"])
    scores = compute_scores(state)

    # Format exactly as frontend expects with `raw` and `reading` fields
    # In a real app these would be dynamically generated strings based on actual values.
    
    utilization_raw = f"{(state.revolving_used / state.revolving_limit * 100) if state.revolving_limit > 0 else 0:.1f}%"
    payment_raw = f"{100 if state.payments else 0}% on-time"
    foir_raw = f"{(state.total_obligations / state.monthly_income * 100) if state.monthly_income > 0 else 0:.1f}%"
    cash_flow_raw = f"{(state.monthly_income - state.total_obligations - state.other_expenses) / state.monthly_income * 100 if state.monthly_income > 0 else 0:.1f}%"
    emergency_raw = f"{state.emergency_fund / (state.total_obligations + state.other_expenses) if (state.total_obligations + state.other_expenses) > 0 else 0:.1f} months"
    age_raw = f"{state.avg_account_age_months:.1f} months avg, {state.distinct_account_types} types"
    
    return {
        "user_id": state.user_id,
        "display_name": state.display_name,
        "overall": scores.overall,
        "band": scores.band,
        "components": {
            "utilization": {
                "score": float(scores.utilization),
                "weight": 25,
                "raw": utilization_raw,
                "reading": "Good" if scores.utilization >= 70 else "At Risk"
            },
            "payment": {
                "score": float(scores.payment),
                "weight": 25,
                "raw": payment_raw,
                "reading": "Excellent" if scores.payment == 100 else "Fair"
            },
            "foir": {
                "score": float(scores.foir),
                "weight": 20,
                "raw": foir_raw,
                "reading": "Healthy" if scores.foir >= 70 else "High Debt Load"
            },
            "cash_flow": {
                "score": float(scores.cash_flow),
                "weight": 12,
                "raw": cash_flow_raw,
                "reading": "Strong" if scores.cash_flow >= 70 else "Tight"
            },
            "emergency": {
                "score": float(scores.emergency),
                "weight": 10,
                "raw": emergency_raw,
                "reading": "Secure" if scores.emergency >= 70 else "Vulnerable"
            },
            "age_mix": {
                "score": float(scores.age_mix),
                "weight": 8,
                "raw": age_raw,
                "reading": "Fair" if scores.age_mix >= 50 else "Thin File"
            }
        }
    }
