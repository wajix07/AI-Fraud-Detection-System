from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_metrics_discloses_synthetic_data():
    response = client.get("/metrics")
    assert response.status_code == 200
    assert response.json()["data"] == "synthetic"

def test_prediction_requires_valid_fields():
    response = client.post("/predict", json={"amount": -10})
    assert response.status_code == 422

def test_prediction_returns_risk_result():
    response = client.post("/predict", json={
        "amount": 850,
        "hour": 2,
        "distance_from_home_km": 420,
        "is_international": True,
        "transactions_last_24h": 8,
        "merchant_risk": 0.8
    })
    assert response.status_code == 200
    body = response.json()
    assert 0 <= body["fraud_probability"] <= 1
    assert body["risk_level"] in {"LOW", "MEDIUM", "HIGH"}
    assert body["recommended_action"]
    assert body["signals"]
