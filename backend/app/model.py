from pathlib import Path
import joblib
import numpy as np

FEATURES = [
    "amount", "hour", "distance_from_home_km",
    "is_international", "transactions_last_24h", "merchant_risk"
]
MODEL_PATH = Path(__file__).resolve().parents[1] / "artifacts" / "fraud_model.joblib"

def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError("Model not found. Run `python train.py` from backend/.")
    return joblib.load(MODEL_PATH)

def explain_signals(data: dict) -> list[str]:
    signals = []
    if data["amount"] >= 700:
        signals.append("High transaction amount")
    if data["hour"] <= 5:
        signals.append("Unusual late-night transaction time")
    if data["distance_from_home_km"] >= 200:
        signals.append("Transaction far from usual location")
    if data["is_international"]:
        signals.append("International transaction")
    if data["transactions_last_24h"] >= 6:
        signals.append("High transaction frequency")
    if data["merchant_risk"] >= 0.7:
        signals.append("High-risk merchant category")
    return signals or ["No strong rule-based warning signal"]
