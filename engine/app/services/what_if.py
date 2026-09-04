from typing import Dict, Any
from app.services.health_score import calculate_health_score
from app.utils.financial_math import calculate_emi

def simulate_pay_debt(current_profile: Dict[str, Any], amount_to_pay: float) -> Dict[str, Any]:
    # Assume amount_to_pay is applied to total_used_credit
    simulated_used_credit = max(0, current_profile['total_used_credit'] - amount_to_pay)
    
    # Calculate new score
    sim_health = calculate_health_score(
        total_used_credit=simulated_used_credit,
        total_available_credit=current_profile['total_available_credit'],
        monthly_obligations=current_profile['monthly_obligations'],
        monthly_income=current_profile['monthly_income'],
        emergency_fund=current_profile['emergency_fund'] - amount_to_pay # Assume paid from savings
    )
    
    return {
        "new_metrics": sim_health,
        "delta_score": sim_health['overall_health_score'] - current_profile['overall_health_score'],
        "insight": f"Paying off ₹{amount_to_pay} improves your score by {sim_health['overall_health_score'] - current_profile['overall_health_score']} points, but reduces your emergency fund."
    }

def simulate_take_loan(current_profile: Dict[str, Any], principal: float, rate: float, months: int) -> Dict[str, Any]:
    new_emi = calculate_emi(principal, rate, months)
    
    simulated_obligations = current_profile['monthly_obligations'] + new_emi
    simulated_used_credit = current_profile['total_used_credit'] + principal
    simulated_available = current_profile['total_available_credit'] + principal
    
    sim_health = calculate_health_score(
        total_used_credit=simulated_used_credit,
        total_available_credit=simulated_available,
        monthly_obligations=simulated_obligations,
        monthly_income=current_profile['monthly_income'],
        emergency_fund=current_profile['emergency_fund']
    )
    
    return {
        "new_metrics": sim_health,
        "new_emi": new_emi,
        "delta_score": sim_health['overall_health_score'] - current_profile['overall_health_score'],
        "insight": f"Taking this loan adds ₹{new_emi}/month in obligations. Your overall score changes by {sim_health['overall_health_score'] - current_profile['overall_health_score']} points."
    }

def simulate_close_account(current_profile: Dict[str, Any], credit_limit: float, account_balance: float = 0.0) -> Dict[str, Any]:
    # Closing an account reduces total available credit
    # If the account had a balance, it needs to be paid off or transferred, but let's assume it was zero balance for now
    simulated_available = max(0, current_profile['total_available_credit'] - credit_limit)
    simulated_used_credit = max(0, current_profile['total_used_credit'] - account_balance)
    
    sim_health = calculate_health_score(
        total_used_credit=simulated_used_credit,
        total_available_credit=simulated_available,
        monthly_obligations=current_profile['monthly_obligations'],
        monthly_income=current_profile['monthly_income'],
        emergency_fund=current_profile['emergency_fund']
    )
    
    return {
        "new_metrics": sim_health,
        "delta_score": sim_health['overall_health_score'] - current_profile['overall_health_score'],
        "insight": f"Closing this account changes your score by {sim_health['overall_health_score'] - current_profile['overall_health_score']} points, primarily by changing your credit utilization."
    }

def simulate_asset_purchase(current_profile: Dict[str, Any], asset_price: float, down_payment: float, rate: float, months: int, monthly_maintenance: float = 0.0) -> Dict[str, Any]:
    principal = max(0, asset_price - down_payment)
    new_emi = calculate_emi(principal, rate, months)
    
    total_new_obligations = new_emi + monthly_maintenance
    simulated_obligations = current_profile['monthly_obligations'] + total_new_obligations
    simulated_used_credit = current_profile['total_used_credit'] + principal
    simulated_available = current_profile['total_available_credit'] + principal
    simulated_emergency_fund = max(0, current_profile['emergency_fund'] - down_payment)
    
    sim_health = calculate_health_score(
        total_used_credit=simulated_used_credit,
        total_available_credit=simulated_available,
        monthly_obligations=simulated_obligations,
        monthly_income=current_profile['monthly_income'],
        emergency_fund=simulated_emergency_fund
    )
    
    return {
        "new_metrics": sim_health,
        "new_emi": new_emi,
        "monthly_maintenance": monthly_maintenance,
        "delta_score": sim_health['overall_health_score'] - current_profile['overall_health_score'],
        "insight": f"Buying this asset adds ₹{total_new_obligations}/month in obligations. Your overall score changes by {sim_health['overall_health_score'] - current_profile['overall_health_score']} points."
    }

def run_simulation(sim_type: str, current_profile: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
    if sim_type == 'pay_debt':
        return simulate_pay_debt(current_profile, params.get('amount', 0))
    elif sim_type == 'take_loan':
        return simulate_take_loan(current_profile, params.get('amount', 0), params.get('rate', 0), params.get('months', 12))
    elif sim_type == 'close_account':
        return simulate_close_account(current_profile, params.get('credit_limit', 0), params.get('account_balance', 0))
    elif sim_type == 'asset_purchase':
        return simulate_asset_purchase(
            current_profile, 
            params.get('asset_price', 0), 
            params.get('down_payment', 0), 
            params.get('rate', 0), 
            params.get('months', 60),
            params.get('monthly_maintenance', 0)
        )
    else:
        return {"error": "Unknown simulation type"}
