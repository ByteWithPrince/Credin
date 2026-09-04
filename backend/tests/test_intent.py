from decimal import Decimal
from app.services.personas import ROHIT_ID, build_state
from app.services.intent.keyword import extract_amount_inr, parse_keyword


def test_extract_amount_inr():
    assert extract_amount_inr("What if I pay 50,000 toward my card?") == Decimal("50000.00")
    assert extract_amount_inr("Pay ₹50000 to HDFC") == Decimal("50000.00")
    assert extract_amount_inr("Pay 50k now") == Decimal("50000.00")
    assert extract_amount_inr("Can I afford 1.5 lakh car loan") == Decimal("150000.00")
    assert extract_amount_inr("Need 15 lakh loan") == Decimal("1500000.00")
    assert extract_amount_inr("Buy 1 crore house") == Decimal("10000000.00")
    assert extract_amount_inr("8L car loan") == Decimal("800000.00")
    assert extract_amount_inr("3 lakh personal loan") == Decimal("300000.00")


def test_parse_demo_questions():
    rohit = build_state(ROHIT_ID)

    # Pay debt question
    p1 = parse_keyword("What if I pay ₹50,000 toward my HDFC card?", rohit)
    assert p1 is not None
    assert p1.kind == "pay_debt"
    assert p1.amount == Decimal("50000.00")
    assert p1.account_id == "acc-rohit-hdfc"

    # Close card question
    p2 = parse_keyword("Should I close my Axis card?", rohit)
    assert p2 is not None
    assert p2.kind == "close_card"
    assert p2.account_id == "acc-rohit-axis"

    # Loan question
    p3 = parse_keyword("Can I afford a ₹15 lakh car loan?", rohit)
    assert p3 is not None
    assert p3.kind == "take_loan"
    assert p3.principal == Decimal("1500000.00")
    assert p3.kind_of_loan == "secured_loan"

    # Unrecognized / junk query
    assert parse_keyword("What is the weather in Mumbai?", rohit) is None
    assert parse_keyword("", rohit) is None
