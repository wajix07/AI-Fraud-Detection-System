import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import Transaction, Prediction
from app.model import load_model, explain_signals, FEATURES

app = FastAPI(title="AI Fraud Detection API", version="1.0.0",
              description="Educational transaction-risk scoring demo.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "fraud-detection-api"}

@app.get("/metrics")
def metrics():
    # Training metrics are intentionally not presented as production performance.
    return {"model": "RandomForestClassifier", "data": "synthetic",
            "warning": "Demo-only metrics; not representative of real transactions."}

@app.post("/predict", response_model=Prediction)
def predict(transaction: Transaction):
    try:
        model = load_model()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    data = transaction.model_dump()
    data["is_international"] = int(data["is_international"])
    row = pd.DataFrame([[data[k] for k in FEATURES]], columns=FEATURES)
    probability = float(model.predict_proba(row)[0][1])
    risk = "HIGH" if probability >= 0.70 else "MEDIUM" if probability >= 0.35 else "LOW"
    action = "Flag for manual review" if risk == "HIGH" else (
        "Request additional verification" if risk == "MEDIUM" else "Allow; continue monitoring"
    )
    return Prediction(
        fraud_probability=round(probability, 4),
        risk_level=risk,
        recommended_action=action,
        signals=explain_signals(data),
    )
