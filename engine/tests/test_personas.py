from decimal import Decimal
import pytest
from app.services.personas import build_state
from app.services.health_score import compute_scores

def test_rohit_sharma_persona():
    state = build_state("persona-rohit")
    scores = compute_scores(state)

    # Rohit ground-truth expectations per AGENTS.md:
    # utilization: 70.0 (U=30.0%)
    # payment: 80.0
    # FOIR: ~34.2 (FOIR ~49.0%)
    # cash flow: ~96.1
    # emergency: ~58.2 (coverage ~3.49 months)
    # age_mix: ~49.9
    # overall: 66, band: Fair
    assert scores.overall == 66
    assert scores.band == "Fair"
    assert scores.utilization == Decimal("70.00")
    assert scores.payment == Decimal("80.00")
    assert abs(scores.foir - Decimal("34.2")) <= Decimal("0.3")
    assert abs(scores.cash_flow - Decimal("96.1")) <= Decimal("0.3")
    assert abs(scores.emergency - Decimal("58.2")) <= Decimal("0.3")
    assert abs(scores.age_mix - Decimal("49.9")) <= Decimal("0.3")
    assert state.total_obligations == Decimal("35246.95")

def test_priya_nair_persona():
    state = build_state("persona-priya")
    scores = compute_scores(state)

    # Priya ground-truth:
    # Thin file payment: 60.0
    # overall: 66, band: Fair
    assert scores.overall == 66
    assert scores.band == "Fair"
    assert scores.payment == Decimal("60.00")
    assert state.total_obligations == Decimal("12900.00")

def test_arjun_mehta_persona():
    state = build_state("persona-arjun")
    scores = compute_scores(state)

    # Arjun ground-truth:
    # overall: 97, band: Strong
    assert scores.overall == 97
    assert scores.band == "Strong"
    assert scores.utilization == Decimal("100.00")
    assert scores.payment == Decimal("100.00")
    assert scores.foir == Decimal("100.00")
    assert state.total_obligations == Decimal("40500.00")
