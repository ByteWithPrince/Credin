from decimal import Decimal
import pytest
from app.services.personas import (
    ROHIT_ID,
    PRIYA_ID,
    ARJUN_ID,
    build_state,
)
from app.services.health_score import compute_scores


def test_rohit_persona_scores():
    rohit = build_state(ROHIT_ID)
    scores = compute_scores(rohit)

    # Verification from AGENTS.md:
    # Rohit base: overall 66, Fair
    # Components: utilization 70.0, payment 80.0, FOIR 34.2, cash flow 96.1, emergency 58.2, age & mix 49.9
    # Obligations: 35246.95
    assert rohit.total_obligations == Decimal("35246.95")
    assert scores.overall == 66
    assert scores.band == "Fair"

    assert pytest.approx(float(scores.utilization), abs=0.2) == 70.0
    assert pytest.approx(float(scores.payment), abs=0.2) == 80.0
    assert pytest.approx(float(scores.foir), abs=0.2) == 34.2
    assert pytest.approx(float(scores.cash_flow), abs=0.2) == 96.1
    assert pytest.approx(float(scores.emergency), abs=0.2) == 58.2
    assert pytest.approx(float(scores.age_mix), abs=0.2) == 49.9


def test_priya_persona_scores():
    priya = build_state(PRIYA_ID)
    scores = compute_scores(priya)

    # Verification from AGENTS.md:
    # Priya base: overall 66, Fair
    # utilization 61.0, payment 60.0 (thin file), FOIR 100.0, cash flow 100.0, emergency 19.0, age_mix 18.7
    assert priya.total_obligations == Decimal("12900.00")
    assert scores.overall == 66
    assert scores.band == "Fair"

    assert pytest.approx(float(scores.utilization), abs=0.2) == 61.0
    assert float(scores.payment) == 60.0
    assert float(scores.foir) == 100.0
    assert float(scores.cash_flow) == 100.0
    assert pytest.approx(float(scores.emergency), abs=0.2) == 19.0
    assert pytest.approx(float(scores.age_mix), abs=0.2) == 18.7


def test_arjun_persona_scores():
    arjun = build_state(ARJUN_ID)
    scores = compute_scores(arjun)

    # Verification from AGENTS.md:
    # Arjun base: overall 97, Strong
    # utilization 100.0, payment 100.0, FOIR 100.0, cash flow 100.0, emergency 87.7, age_mix 81.6
    assert arjun.total_obligations == Decimal("40500.00")
    assert scores.overall == 97
    assert scores.band == "Strong"

    assert float(scores.utilization) == 100.0
    assert float(scores.payment) == 100.0
    assert float(scores.foir) == 100.0
    assert float(scores.cash_flow) == 100.0
    assert pytest.approx(float(scores.emergency), abs=0.2) == 87.7
    assert pytest.approx(float(scores.age_mix), abs=0.2) == 81.6
