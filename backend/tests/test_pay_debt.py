from decimal import Decimal
import pytest

from app.services.personas import ROHIT_ID, build_state
from app.services.scenarios.pay_debt import simulate_pay_debt
from app.services.scenarios.base import format_inr
from app.services.financial_math import months_of_coverage


def test_format_inr():
    assert format_inr(Decimal("1000")) == "₹1,000.00"
    assert format_inr(Decimal("100000")) == "₹1,00,000.00"
    assert format_inr(Decimal("1234567.5")) == "₹12,34,567.50"
    assert format_inr(Decimal("12345678")) == "₹1,23,45,678.00"


def test_rohit_pay_50k_from_savings():
    rohit = build_state(ROHIT_ID)
    hdfc_card_id = "acc-rohit-hdfc"

    result = simulate_pay_debt(rohit, hdfc_card_id, Decimal("50000.00"), from_savings=True)

    assert result.score_before == 66
    assert result.score_after == 74
    assert result.band_after == "Healthy"
    assert result.verdict == "caution"

    # Exactly 1 guard-rail
    assert len(result.guard_rails) == 1
    gr = result.guard_rails[0]
    assert gr.code == "EMERGENCY_FUND_BREACH"
    assert "₹29,700" in gr.suggestion

    # Verify that paying 29700 maintains >= 3.0 months coverage
    result_safe = simulate_pay_debt(rohit, hdfc_card_id, Decimal("29700.00"), from_savings=True)
    assert len(result_safe.guard_rails) == 0


def test_rohit_pay_50k_not_from_savings():
    rohit = build_state(ROHIT_ID)
    hdfc_card_id = "acc-rohit-hdfc"

    result = simulate_pay_debt(rohit, hdfc_card_id, Decimal("50000.00"), from_savings=False)

    assert result.score_before == 66
    assert result.score_after == 75
    assert len(result.guard_rails) == 0
    assert result.verdict == "good"
