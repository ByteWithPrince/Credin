from decimal import Decimal
import pytest
from app.services.personas import build_state
from app.services.scenarios.pay_debt import simulate_pay_debt
from app.services.scenarios.close_card import simulate_close_card
from app.services.scenarios.take_loan import simulate_take_loan
from app.services.financial_math import months_of_coverage

def test_scenario_rohit_pay_debt_with_guard_rail():
    rohit = build_state("persona-rohit")
    hdfc_card_id = "rohit-hdfc-regalia"

    # Simulate paying 50,000 from savings
    res = simulate_pay_debt(rohit, hdfc_card_id, Decimal("50000"), from_savings=True)

    # Golden assertion 1: score rises from 66 to 74
    assert res.score_before == 66
    assert res.score_after == 74
    assert res.band_after == "Healthy"

    # Golden assertion 2: Emergency fund guard-rail fires
    assert len(res.guard_rails) == 1
    guard = res.guard_rails[0]
    assert guard.code == "EMERGENCY_FUND_BREACH"
    assert guard.severity == "warning"

    # Golden assertion 3: Counter-proposal calculation is exactly ₹29,700
    assert "₹29,700.00" in guard.suggestion

    # Verify coverage after paying the counter-proposal ₹29,700 is >= 3.0 months
    new_fund = rohit.emergency_fund - Decimal("29700")
    new_obligations = rohit.total_obligations - (Decimal("0.05") * Decimal("29700"))
    cov = months_of_coverage(new_fund, rohit.other_expenses, new_obligations)
    assert cov >= Decimal("3.0")

    # Verdict is caution because guard-rail fired
    assert res.verdict == "caution"

def test_scenario_rohit_close_axis_card():
    rohit = build_state("persona-rohit")
    axis_card_id = "rohit-axis-ace"

    # Simulate closing Axis Ace card (limit 100,000, balance 28,000)
    res = simulate_close_card(rohit, axis_card_id)

    # Golden assertion: score drops from 66 to 60 (Fair)
    assert res.score_before == 66
    assert res.score_after == 60
    assert res.band_after == "Fair"
    assert res.verdict == "bad"

def test_scenario_priya_take_8L_car_loan():
    priya = build_state("persona-priya")

    # Priya takes ₹8L loan @ 9.2% for 60 months
    res = simulate_take_loan(
        priya,
        principal=Decimal("800000"),
        annual_rate_pct=Decimal("9.2"),
        tenure_months=60,
        kind="secured_loan",
        display_name="Car Loan"
    )

    # Golden assertion: score drops to 39 (Critical), FOIR exceeds 65%, decline
    assert res.score_after == 39
    assert res.band_after == "Critical"
    assert res.verdict == "bad"
    assert any(g.code == "FOIR_OVERLEVERAGED_BREACH" for g in res.guard_rails)

def test_scenario_arjun_take_3L_loan():
    arjun = build_state("persona-arjun")

    # Arjun takes ₹3L loan @ 11.0% for 36 months
    res = simulate_take_loan(
        arjun,
        principal=Decimal("300000"),
        annual_rate_pct=Decimal("11.0"),
        tenure_months=36,
        kind="unsecured_loan",
        display_name="Personal Loan"
    )

    # Golden assertion: score drops slightly from 97 to 96 (Strong), approve (FOIR ~28%)
    assert res.score_before == 97
    assert res.score_after == 96
    assert res.band_after == "Strong"
    assert res.verdict == "good"
