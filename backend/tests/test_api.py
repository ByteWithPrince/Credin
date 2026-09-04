from fastapi.testclient import TestClient
from app.main import app
from app.services.personas import ROHIT_ID

client = TestClient(app)


def test_get_personas():
    response = client.get("/api/personas")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    scores = [p["overall_score"] for p in data]
    assert scores == [66, 66, 97]


def test_simulate_rohit_pay_50k():
    payload = {
        "kind": "pay_debt",
        "user_id": ROHIT_ID,
        "account_id": "acc-rohit-hdfc",
        "amount": "50000.00",
        "from_savings": True,
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["score_before"] == 66
    assert data["score_after"] == 74
    assert len(data["guard_rails"]) == 1
    assert data["guard_rails"][0]["code"] == "EMERGENCY_FUND_BREACH"


def test_simulate_bad_kind_422():
    payload = {
        "kind": "invalid_scenario_kind",
        "user_id": ROHIT_ID,
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 422


def test_simulate_unknown_account_404():
    payload = {
        "kind": "pay_debt",
        "user_id": ROHIT_ID,
        "account_id": "nonexistent-account-id",
        "amount": "10000.00",
        "from_savings": True,
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 404


def test_user_score_endpoint():
    response = client.get(f"/api/users/{ROHIT_ID}/score")
    assert response.status_code == 200
    data = response.json()
    assert data["overall"] == 66
    assert data["band"] == "Fair"
    assert "components" in data
    assert "utilization" in data["components"]


def test_optimizer_endpoint():
    payload = {
        "user_id": ROHIT_ID,
        "monthly_budget": "20000.00",
        "strategy": "avalanche",
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["strategy"] == "avalanche"
    assert data["months_to_debt_free"] > 0


def test_money_field_is_string():
    payload = {
        "kind": "pay_debt",
        "user_id": ROHIT_ID,
        "account_id": "acc-rohit-hdfc",
        "amount": "50000.00",
        "from_savings": True,
    }
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    raw_payment = data["money_facts"][0]["raw"]
    assert isinstance(raw_payment, str)
    assert raw_payment == "50000.00"


def test_improvement_plan_endpoint():
    response = client.post("/api/improve/plan", json={"user_id": ROHIT_ID})
    assert response.status_code == 200
    data = response.json()
    assert "milestones" in data
    assert len(data["milestones"]) >= 2
    assert "weaknesses" in data
