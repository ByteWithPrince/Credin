def calculate_emi(principal: float, annual_rate: float, tenure_months: int) -> float:
    if principal <= 0 or tenure_months <= 0:
        return 0.0
    if annual_rate == 0:
        return principal / tenure_months
        
    monthly_rate = annual_rate / 12 / 100
    emi = (principal * monthly_rate * ((1 + monthly_rate) ** tenure_months)) / (((1 + monthly_rate) ** tenure_months) - 1)
    return round(emi, 2)

def calculate_dti(monthly_obligations: float, monthly_income: float) -> float:
    if monthly_income <= 0:
        return 1.0 # 100% or more
    return round(monthly_obligations / monthly_income, 4)

def calculate_utilization(total_used: float, total_available: float) -> float:
    if total_available <= 0:
        return 0.0
    return round(total_used / total_available, 4)
