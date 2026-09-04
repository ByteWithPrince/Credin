from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from app.services.health_score import calculate_health_score

router = APIRouter(prefix="/health", tags=["health"])

class HealthScoreRequest(BaseModel):
    total_used_credit: float
    total_available_credit: float
    monthly_obligations: float
    monthly_income: float
    emergency_fund: float

@router.post("/score")
def get_health_score(req: HealthScoreRequest):
    result = calculate_health_score(
        total_used_credit=req.total_used_credit,
        total_available_credit=req.total_available_credit,
        monthly_obligations=req.monthly_obligations,
        monthly_income=req.monthly_income,
        emergency_fund=req.emergency_fund
    )
    return result
