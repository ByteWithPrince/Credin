from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_healthz_endpoint():
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_personas_api():
    res = client.get("/api/personas")
    assert res.status_code == 200
    personas = res.json()
    assert len(personas) == 3
    assert any(p["name"] == "Rohit Sharma" and p["overall_score"] == 66 for p in personas)
    assert any(p["name"] == "Arjun Mehta" and p["overall_score"] == 97 for p in personas)

def test_simulate_pay_debt_api():
    payload = {
        "user_id": "persona-rohit",
        "account_id": "rohit-hdfc-regalia",
        "amount": "50000",
        "from_savings": True
    }
    res = client.post("/api/simulate/pay-debt", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["score_before"] == 66
    assert data["score_after"] == 74
    assert len(data["guard_rails"]) == 1
    assert "₹29,700.00" in data["guard_rails"][0]["suggestion"]

def test_optimize_api():
    payload = {
        "user_id": "persona-rohit",
        "monthly_budget": "40000"
    }
    res = client.post("/api/optimize", json=payload)
    assert res.status_code == 200
    results = res.json()
    assert len(results) == 4
