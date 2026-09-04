from decimal import Decimal
from app.services.financial_math import (
    emi,
    total_interest,
    amortization_schedule,
    months_to_payoff,
    utilization_ratio,
    foir_ratio,
    surplus_ratio,
    months_of_coverage,
)


def test_golden_emi_values():
    # Verified ground-truth EMI benchmarks from AGENTS.md
    assert emi(500000, Decimal("10.5"), 60) == Decimal("10746.95")
    assert total_interest(500000, Decimal("10.5"), 60) == Decimal("144817.01")

    assert emi(1500000, Decimal("9.2"), 84) == Decimal("24286.14")
    assert total_interest(1500000, Decimal("9.2"), 84) == Decimal("540036.14")

    assert emi(800000, Decimal("9.2"), 60) == Decimal("16684.44")
    assert emi(300000, Decimal("11.0"), 36) == Decimal("9821.62")

    # 0% interest case
    assert emi(120000, 0, 12) == Decimal("10000.00")
    assert total_interest(120000, 0, 12) == Decimal("0.00")


def test_amortization_schedule():
    schedule = amortization_schedule(500000, Decimal("10.5"), 60)
    assert len(schedule) == 60
    assert schedule[-1]["closing_balance"] == Decimal("0.00")
    
    # Sum of principal components must equal exact principal
    total_principal_paid = sum(row["principal_component"] for row in schedule)
    assert total_principal_paid == Decimal("500000.00")


def test_months_to_payoff():
    # Payment less than monthly interest -> returns None
    assert months_to_payoff(100000, Decimal("42.0"), Decimal("1000")) is None

    # Realistic payoff
    res = months_to_payoff(50000, Decimal("12.0"), Decimal("5000"))
    assert res is not None
    assert res > 0


def test_ratio_zero_denominators():
    assert utilization_ratio(50000, 0) == Decimal("0.00")
    assert foir_ratio(30000, 0) == Decimal("0.00")
    assert surplus_ratio(0, 10000, 20000) == Decimal("0.00")
    assert months_of_coverage(100000, 0, 0) == Decimal("0.00")
