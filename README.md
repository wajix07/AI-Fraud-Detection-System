# AI-Powered Fraud Detection System

A portfolio-ready full-stack starter that scores bank-card transactions for potential fraud. It includes a reproducible synthetic dataset, a scikit-learn model, a FastAPI REST API, a React dashboard, and tests.

> **Important:** This is an educational demo. It uses synthetic data and must not be used to approve, decline, or investigate real financial transactions.

## Features
- Train a Random Forest classifier on generated transaction data.
- Return a fraud probability, risk band, and contributing transaction signals.
- REST endpoints: `/health`, `/metrics`, `/predict`.
- React interface to submit a sample transaction and view the prediction.
- Unit tests and Docker-ready backend.

## Architecture
```text
React dashboard (Vite)
       |
       | HTTP / JSON
       v
FastAPI service ----> scikit-learn model
       |                    ^
       v                    |
Synthetic transaction data + training script
```

## Quick start

### 1. Backend
Python 3.10+ is recommended.

```bash
cd backend
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
python train.py
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

### 2. Frontend
In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173).

## Example API request

```bash
curl -X POST http://127.0.0.1:8000/predict \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 850.0, "hour": 2, "distance_from_home_km": 420.0, "is_international": true, "transactions_last_24h": 8, "merchant_risk": 0.8}'
```

## Project structure
```text
ai-fraud-detection/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── schemas.py
│   │   └── model.py
│   ├── tests/test_api.py
│   ├── train.py
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── style.css
```

## Model and data
`backend/train.py` generates a deterministic synthetic dataset and trains a Random Forest. The model is saved to `backend/artifacts/fraud_model.joblib`. The generated data intentionally encodes patterns such as unusually high amounts, late-night activity, international usage, distance from home, and merchant risk. Because this is synthetic, its metrics are not evidence of real-world performance.

## Next improvements
- Replace synthetic data with a properly licensed, anonymized dataset.
- Use time-based train/validation/test splits and report precision, recall, F1, PR-AUC, and a confusion matrix.
- Add authentication, audit logging, model versioning, and monitoring.
- Add PostgreSQL persistence and role-based access controls.
- Calibrate thresholds with fraud analysts; do not rely on accuracy alone.
