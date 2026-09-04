from decimal import Decimal
import pytest

from app.services.personas import ROHIT_ID, build_state
from app.services.scenarios.close_card import simulate_close_card


def test_rohit_close_axis_ace():
    rohit = build_state(ROHIT_ID)
    axis_ace_id = "acc-rohit-axis"

    result = simulate_close_card(rohit, axis_ace_id)

    # Verification from AGENTS.md:
    # Rohit closing Axis Ace -> overall 66 -> 60 (Fair)
    assert result.score_before == 66
    assert result.score_after == 60
    assert result.band_after == "Fair"
    assert result.verdict == "bad"

    # Utilization component moves 70.0 -> 47.5
    u_delta = next(d for d in result.component_deltas if d.component == "utilization")
    assert pytest.approx(float(u_delta.before), abs=0.2) == 70.0
    assert pytest.approx(float(u_delta.after), abs=0.2) == 47.5

    # Other components do not move
    for d in result.component_deltas:
        if d.component != "utilization":
            assert d.delta == Decimal("0.0"), f"Component {d.component} should not have changed"

    # Invariant: revolving_used unchanged at 90,000, limit drops from 300k to 200k
    assert any(gr.code == "UTILIZATION_THRESHOLD_CROSSED" for gr in result.guard_rails)


def test_rohit_close_hdfc_card_oldest():
    rohit = build_state(ROHIT_ID)
    hdfc_card_id = "acc-rohit-hdfc"

    result = simulate_close_card(rohit, hdfc_card_id)

    assert any(gr.code == "OLDEST_ACCOUNT_CLOSED" for gr in result.guard_rails)
