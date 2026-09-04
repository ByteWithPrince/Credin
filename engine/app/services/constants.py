"""
Authoritative threshold constants and scoring weights for CreditIn.
Never inline magic numbers in services or calculators.
"""

from decimal import Decimal

FOIR_HEALTHY           = Decimal("0.40")   # above this, decline new credit
FOIR_OVERLEVERAGED     = Decimal("0.50")
EMERGENCY_FLOOR_MONTHS = Decimal("3.0")    # below this, guard-rail fires
UTILIZATION_TARGET     = Decimal("0.30")
SINGLE_CARD_DANGER     = Decimal("0.90")

WEIGHTS = {
    "utilization": 25,
    "payment": 25,
    "foir": 20,
    "cash_flow": 12,
    "emergency": 10,
    "age_mix": 8,
}
assert sum(WEIGHTS.values()) == 100, "Weights must sum to exactly 100"

BANDS = [
    (0, 39, "Critical"),
    (40, 54, "At Risk"),
    (55, 69, "Fair"),
    (70, 84, "Healthy"),
    (85, 100, "Strong"),
]

THIN_FILE_RELIABILITY  = Decimal("60")   # score when no payment history exists
FULL_AGE_MONTHS        = Decimal("84")   # 7 years = full marks on credit age (84 months)
MIN_PAYMENT_RATE       = Decimal("0.05") # card minimum = 5% of balance
