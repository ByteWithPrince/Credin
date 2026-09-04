"""
Health score router providing composite and detailed 6-component readings.
"""

from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_session
from app.models.mapper import to_financial_state
from app.services.personas import build_state, PERSONAS_BUILDERS
from app.services.health_score import compute_scores
from app.services.financial_math import (
    utilization_ratio,
    foir_ratio,
    surplus_ratio,
    months_of_coverage,
)

router = APIRouter(prefix="/users", tags=["health_score"])


@router.get("/{user_id}/score")
def get_user_score(user_id: str, session: Session = Depends(get_session)):
    """
    Returns ComponentScores plus raw ratios and one-line plain-English interpretations.
    """
    state = None
    try:
        state = to_financial_state(session, user_id)
    except Exception:
        pass

    if not state:
        if user_id in PERSONAS_BUILDERS:
            state = build_state(user_id)
        else:
            raise HTTPException(status_code=404, detail="User not found")

    scores = compute_scores(state)

    u_ratio = utilization_ratio(state.revolving_used, state.revolving_limit) * Decimal("100")
    f_ratio = foir_ratio(state.total_obligations, state.monthly_income) * Decimal("100")
    s_ratio = surplus_ratio(state.monthly_income, state.other_expenses, state.total_obligations) * Decimal("100")
    m_cov = months_of_coverage(state.emergency_fund, state.other_expenses, state.total_obligations)

    breakdown = {
        "utilization": {
            "score": scores.utilization,
            "weight": 25,
            "raw": f"{u_ratio:.1f}%",
            "reading": f"Revolving utilization is {u_ratio:.1f}% (" + ("healthy, below 30%" if u_ratio <= 30 else "above 30% target") + ")",
        },
        "payment": {
            "score": scores.payment,
            "weight": 25,
            "raw": "100%" if scores.payment >= 100 else f"{scores.payment:.0f}%",
            "reading": "Flawless on-time payment track record" if scores.payment >= 100 else ("Thin credit file with limited history" if scores.payment == 60 and not state.payments else "Contains late payment records affecting score"),
        },
        "foir": {
            "score": scores.foir,
            "weight": 20,
            "raw": f"{f_ratio:.1f}%",
            "reading": f"Debt obligations consume {f_ratio:.1f}% of income (" + ("safe, under 40%" if f_ratio <= 40 else "overleveraged, above 40%") + ")",
        },
        "cash_flow": {
            "score": scores.cash_flow,
            "weight": 12,
            "raw": f"{s_ratio:.1f}%",
            "reading": f"Monthly savings surplus is {s_ratio:.1f}% of income",
        },
        "emergency": {
            "score": scores.emergency,
            "weight": 10,
            "raw": f"{m_cov:.1f} mo",
            "reading": f"Emergency fund covers {m_cov:.1f} months of expenses and obligations (" + ("ideal >= 6 months" if m_cov >= 6 else "below recommended 6 months") + ")",
        },
        "age_mix": {
            "score": scores.age_mix,
            "weight": 8,
            "raw": f"{state.avg_account_age_months:.1f} mo, {state.distinct_account_types} types",
            "reading": f"Average account age {state.avg_account_age_months:.1f} months across {state.distinct_account_types} credit types",
        },
    }

    return {
        "user_id": user_id,
        "display_name": state.display_name,
        "overall": scores.overall,
        "band": scores.band,
        "components": breakdown,
    }
