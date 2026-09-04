"""
Improvement Plan service for CreditIn.
Analyzes weaknesses in financial state and generates a personalized, milestone-based roadmap.
"""

from typing import Dict, Any, List
from decimal import Decimal
from app.models.domain import FinancialState
from app.services.health_score import compute_scores
from app.services.personas import build_state


def generate_plan_for_state(state: FinancialState) -> Dict[str, Any]:
    """Generates an improvement plan from a deterministic FinancialState."""
    scores = compute_scores(state)
    weaknesses: List[str] = []
    milestones: List[Dict[str, Any]] = []

    # 1. Analyze weaknesses
    if scores.utilization < 70:
        weaknesses.append("High Credit Utilization (>30%)")
    if scores.foir < 70:
        weaknesses.append("High Debt-to-Income / FOIR (>40%)")
    if scores.emergency < 60:
        weaknesses.append("Low Emergency Fund (<3 months)")
    if scores.payment < 75:
        weaknesses.append("Late Payment History")
    if scores.age_mix < 60:
        weaknesses.append("Thin Credit File / Needs Account Aging")

    if not weaknesses:
        weaknesses.append("Prime Health Profile — Optimization Focus")

    month_offset = 1

    if "High Credit Utilization (>30%)" in weaknesses:
        milestones.append({
            "month_number": month_offset,
            "title": "Reduce Revolving Utilization",
            "description": "Pay down high-balance credit cards to bring overall revolving utilization below the 30% target.",
            "targets": {"utilization_below": 30},
        })
        month_offset += 1

    if "High Debt-to-Income / FOIR (>40%)" in weaknesses:
        milestones.append({
            "month_number": month_offset,
            "title": "Accelerate Debt Payoff (Avalanche)",
            "description": "Direct monthly surplus toward high-interest unsecured debt to bring monthly obligations under 40% of income.",
            "targets": {"foir_below": 40},
        })
        month_offset += 1

    if "Low Emergency Fund (<3 months)" in weaknesses:
        milestones.append({
            "month_number": month_offset,
            "title": "Rebuild Emergency Runway",
            "description": "Accumulate liquid savings to ensure at least 3 months of essential living expenses and debt obligations.",
            "targets": {"emergency_months_above": 3},
        })
        month_offset += 1

    if "Thin Credit File / Needs Account Aging" in weaknesses:
        milestones.append({
            "month_number": month_offset,
            "title": "Nurture Account Age & Mix",
            "description": "Keep existing card accounts active and in good standing. Avoid unnecessary hard credit inquiries.",
            "targets": {"hard_inquiries": 0},
        })
        month_offset += 1

    if len(milestones) < 3:
        milestones.append({
            "month_number": month_offset,
            "title": "Maintain On-Time Payment Record",
            "description": "Maintain 100% on-time payments across all card statements and loan EMIs to maximize payment reliability.",
            "targets": {"on_time_pct": 100},
        })

    target_score = min(100, scores.overall + (8 * len(milestones)))

    return {
        "plan_type": "score_improvement",
        "user_id": state.user_id,
        "display_name": state.display_name,
        "current_score": scores.overall,
        "target_score": target_score,
        "band": scores.band,
        "weaknesses": weaknesses,
        "milestones": milestones,
    }


def generate_plan_from_dict(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Fallback generator from a generic dictionary profile."""
    income = float(profile.get("monthly_income", 0)) or 72000.0
    obligations = float(profile.get("monthly_obligations", 0)) or 35000.0
    total_credit = float(profile.get("total_available_credit", 0)) or 300000.0
    used_credit = float(profile.get("total_used_credit", 0)) or 90000.0
    ef = float(profile.get("emergency_fund", 0)) or 179000.0
    current_score = int(profile.get("overall_health_score", 0) or profile.get("overall_score", 0) or 66)

    weaknesses = []
    milestones = []

    utilization = (used_credit / total_credit) if total_credit > 0 else 0.0
    foir = (obligations / income) if income > 0 else 0.0
    ef_months = (ef / obligations) if obligations > 0 else 0.0

    if utilization > 0.30:
        weaknesses.append("High Credit Utilization")
    if foir > 0.40:
        weaknesses.append("High Debt-to-Income Ratio")
    if ef_months < 3.0:
        weaknesses.append("Low Emergency Fund")

    if not weaknesses:
        weaknesses.append("Thin Credit File / Needs Aging")

    m = 1
    if "High Credit Utilization" in weaknesses:
        milestones.append({
            "month_number": m,
            "title": "Reduce Utilization",
            "description": "Pay down your credit card balances to bring total utilization below 30%.",
            "targets": {"utilization_below": 30},
        })
        m += 1

    if "High Debt-to-Income Ratio" in weaknesses:
        milestones.append({
            "month_number": m,
            "title": "Consolidate or Pay Off Loans",
            "description": "Focus on high-interest loans using the Avalanche method.",
            "targets": {"dti_below": 40},
        })
        m += 1

    if "Low Emergency Fund" in weaknesses:
        milestones.append({
            "month_number": m,
            "title": "Build Emergency Runway",
            "description": "Save enough to cover at least 3 months of mandatory obligations.",
            "targets": {"ef_ratio_above": 3},
        })
        m += 1

    if len(milestones) < 3:
        milestones.append({
            "month_number": m,
            "title": "Maintain On-Time Payments",
            "description": "Keep paying all bills on time to build positive payment history.",
            "targets": {"no_late_payments": True},
        })

    target_score = min(100, current_score + (10 * len(milestones)))

    return {
        "plan_type": "score_improvement",
        "current_score": current_score,
        "target_score": target_score,
        "weaknesses": weaknesses,
        "milestones": milestones,
    }
