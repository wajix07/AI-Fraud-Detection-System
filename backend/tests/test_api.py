from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_prediction_requires_valid_fields():
    response = client.post("/predict", json={"amount": -10})
    assert response.status_code == 422
