from decimal import Decimal
import pytest

from app.services.personas import PRIYA_ID, ARJUN_ID, build_state
from app.services.scenarios.take_loan import simulate_take_loan


def test_priya_take_8L_car_loan():
    priya = build_state(PRIYA_ID)

    # Priya takes ₹800,000 car loan at 9.2% over 60 months
    result = simulate_take_loan(
        priya,
        principal=Decimal("800000.00"),
        annual_rate_pct=Decimal("9.2"),
        months=60,
        kind="secured_loan",
    )

    # Verification from AGENTS.md:
    # Priya, after ₹8L car loan @9.2%×60 -> score 39, Critical, FOIR 65.7%, decline
    assert result.score_before == 66
    assert result.score_after == 39
    assert result.band_after == "Critical"
    assert result.verdict == "bad"

    # Verify EMI is 16684.44
    emi_fact = next(m for m in result.money_facts if m.label == "Monthly EMI")
    assert emi_fact.value == "₹16,684.44"

    # Verify FOIR exceeded guard rail
    assert any(gr.code == "FOIR_EXCEEDED" for gr in result.guard_rails)


def test_arjun_take_3L_personal_loan():
    arjun = build_state(ARJUN_ID)

    # Arjun takes ₹300,000 loan at 11.0% over 36 months
    result = simulate_take_loan(
        arjun,
        principal=Decimal("300000.00"),
        annual_rate_pct=Decimal("11.0"),
        months=36,
        kind="unsecured_loan",
    )

    # Verification from AGENTS.md:
    # Arjun, after ₹3L loan @11%×36 -> overall 96 (from 97), FOIR 28.0%, approve
    assert result.score_before == 97
    assert result.score_after == 96
    assert result.band_after == "Strong"
    assert result.verdict == "good"

    # Verify EMI is 9821.62
    emi_fact = next(m for m in result.money_facts if m.label == "Monthly EMI")
    assert emi_fact.value == "₹9,821.62"

    assert len(result.guard_rails) == 0
