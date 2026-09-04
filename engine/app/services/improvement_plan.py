from typing import Dict, Any, List

def generate_improvement_plan(current_profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates a personalized credit score improvement plan.
    Analyzes weaknesses and generates monthly milestones.
    """
    weaknesses = []
    milestones = []
    
    # Compute metrics safely
    available = current_profile.get('total_available_credit', 0)
    utilization = current_profile.get('total_used_credit', 0) / available if available > 0 else 0.0
    
    income = current_profile.get('monthly_income', 0)
    dti = current_profile.get('monthly_obligations', 0) / income if income > 0 else 0.0
    
    obligations = current_profile.get('monthly_obligations', 0)
    ef_ratio = current_profile.get('emergency_fund', 0) / obligations if obligations > 0 else 0.0
    
    # 1. Analyze Weaknesses
    if utilization > 0.30:
        weaknesses.append("High Credit Utilization")
        
    if dti > 0.35:
        weaknesses.append("High Debt-to-Income Ratio")
        
    if ef_ratio < 3:
        weaknesses.append("Low Emergency Fund")
        
    if not weaknesses:
        weaknesses.append("Thin Credit File / Needs Aging")

    # 2. Generate Milestones (simplified for MVP)
    month_offset = 1
    
    if "High Credit Utilization" in weaknesses:
        milestones.append({
            "month_number": month_offset,
            "title": "Reduce Utilization",
            "description": "Pay down your credit card balances to bring total utilization below 30%.",
            "targets": {"utilization_below": 30}
        })
        month_offset += 1
        
    if "High Debt-to-Income Ratio" in weaknesses:
        milestones.append({
            "month_number": month_offset,
            "title": "Consolidate or Pay Off Loans",
            "description": "Focus on high-interest loans using the Avalanche method.",
            "targets": {"dti_below": 35}
        })
        month_offset += 1
        
    if "Low Emergency Fund" in weaknesses:
        milestones.append({
            "month_number": month_offset,
            "title": "Build Emergency Runway",
            "description": "Save enough to cover at least 3 months of mandatory obligations.",
            "targets": {"ef_ratio_above": 3}
        })
        month_offset += 1
        
    # Generic milestones if already healthy
    if len(milestones) < 3:
        milestones.append({
            "month_number": month_offset,
            "title": "Maintain On-Time Payments",
            "description": "Keep paying all bills on time to build positive payment history.",
            "targets": {"no_late_payments": True}
        })
        
    current_score = current_profile.get('overall_health_score', 0)
    target_score = min(100, current_score + (10 * len(milestones)))
        
    return {
        "plan_type": "score_improvement",
        "current_score": current_score,
        "target_score": target_score,
        "weaknesses": weaknesses,
        "milestones": milestones
    }
