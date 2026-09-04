from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from datetime import date, datetime
from uuid import UUID

class SimulationRequest(BaseModel):
    question_text: str
    simulation_type: str
    input_params: Dict[str, Any]

class SimulationResponse(BaseModel):
    id: UUID
    user_id: UUID
    question_text: str
    simulation_type: str
    input_params: Dict[str, Any]
    output_results: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True

class MilestoneBase(BaseModel):
    month_number: int
    title: str
    description: Optional[str] = None
    targets: Dict[str, Any]
    completed: bool = False
    due_date: Optional[date] = None

class Milestone(MilestoneBase):
    id: UUID
    action_plan_id: UUID

    class Config:
        from_attributes = True

class ActionPlanBase(BaseModel):
    plan_type: str
    current_weaknesses: List[Dict[str, Any]]
    target_score: Optional[int] = None
    target_date: Optional[date] = None
    status: str = 'active'

class ActionPlan(ActionPlanBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    milestones: List[Milestone] = []

    class Config:
        from_attributes = True

class ReminderBase(BaseModel):
    type: str
    title: str
    message: str
    scheduled_at: datetime
    reference_id: Optional[UUID] = None

class Reminder(ReminderBase):
    id: UUID
    user_id: UUID
    sent: bool = False
    read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
