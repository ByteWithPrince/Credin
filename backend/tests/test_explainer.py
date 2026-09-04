from decimal import Decimal
from app.services.personas import ROHIT_ID, build_state
from app.services.scenarios.pay_debt import simulate_pay_debt
from app.services.scenarios.close_card import simulate_close_card
from app.services.scenarios.take_loan import simulate_take_loan
from app.services.explainer import render_template, assert_no_invented_numerals


def test_explainer_templates():
    rohit = build_state(ROHIT_ID)

    # 1. Pay debt template
    r1 = simulate_pay_debt(rohit, "acc-rohit-hdfc", Decimal("50000.00"), from_savings=True)
    text1 = render_template(r1, rohit)
    assert "₹50,000.00" in text1
    assert "₹29,700.00" in text1

    # 2. Close card template
    r2 = simulate_close_card(rohit, "acc-rohit-axis")
    text2 = render_template(r2, rohit)
    assert "₹1,00,000.00" in text2

    # 3. Loan template
    r3 = simulate_take_loan(rohit, Decimal("500000.00"), Decimal("10.5"), 60)
    text3 = render_template(r3, rohit)
    assert "₹10,746.95" in text3


def test_numeral_guard_detects_hallucination():
    allowed = {"₹50,000", "50,000", "50000", "66", "74", "3.0"}

    valid_prose = "Paying ₹50,000 increases your score from 66 to 74, maintaining 3.0 months of runway."
    assert assert_no_invented_numerals(valid_prose, allowed) is True

    # Hallucinated number not in allowed set (₹51,000)
    invalid_prose = "Paying ₹51,000 increases your score from 66 to 74."
    assert assert_no_invented_numerals(invalid_prose, allowed) is False
