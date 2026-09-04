from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from app.services.improvement_plan import generate_improvement_plan

from app.models.financial import FinancialProfileBase

router = APIRouter(prefix="/improve", tags=["improve"])

class ImprovementRequest(BaseModel):
    current_profile: FinancialProfileBase

@router.post("/plan")
def get_improvement_plan(req: ImprovementRequest):
    result = generate_improvement_plan(
        current_profile=req.current_profile.model_dump()
    )
    return result
