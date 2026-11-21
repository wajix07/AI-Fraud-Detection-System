# FraudShield AI — AI-Powered Fraud Detection

A full-stack portfolio project that estimates transaction fraud risk using a machine-learning classifier. It combines a React dashboard, a FastAPI backend, and a scikit-learn Random Forest model.

<p align="center">
  <a href="https://fraudshield-ai-dashboard.onrender.com"><strong>Open Live Dashboard</strong></a>
  ·
  <a href="https://ai-fraud-detection-api-0pm4.onrender.com/docs"><strong>Explore API Docs</strong></a>
  ·
  <a href="https://ai-fraud-detection-api-0pm4.onrender.com/health"><strong>Check API Health</strong></a>
</p>

> **Educational use only:** The model is trained on synthetic/demo data. Its scores are not validated for real-world financial decisions and must not be used to approve, decline, block, or investigate actual transactions.

## Live demo

| Component | URL |
|---|---|
| React dashboard | https://fraudshield-ai-dashboard.onrender.com |
| FastAPI service | https://ai-fraud-detection-api-0pm4.onrender.com |
| Interactive Swagger docs | https://ai-fraud-detection-api-0pm4.onrender.com/docs |
| Health endpoint | https://ai-fraud-detection-api-0pm4.onrender.com/health |

The dashboard lets you enter transaction characteristics and request a risk estimate. The API responds with a fraud probability, risk level, recommended action, and explanatory signals. The deployed demo has been manually exercised with low-risk and high-risk examples.

## Features

- Synthetic transaction data generation and reproducible model training.
- Random Forest classification with a probability-style risk score.
- FastAPI REST endpoints, request validation, and interactive OpenAPI documentation.
- React + Vite dashboard for submitting transactions and reviewing results.
- Risk bands, recommended next steps, and human-readable risk signals.
- Pytest API tests and frontend production build.
- Render deployment configuration.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Python, FastAPI, Pydantic |
| Machine learning | scikit-learn, Random Forest, pandas, NumPy, joblib |
| Testing | pytest, HTTPX |
| Deployment | Render |

## Architecture

```text
                 User
                  |
                  v
       React + Vite dashboard
                  |
             HTTP / JSON
                  |
                  v
            FastAPI API
                  |
                  v
       Random Forest classifier
                  |
                  v
     Probability + risk band +
     recommended action + signals

 Training script ---> Synthetic transaction dataset
        |                       |
        +----> trained model ---+
```

See [docs/architecture.md](docs/architecture.md) for the request flow and project structure.

## API example

`POST /predict`

Request:

```json
{
  "amount": 1000000,
  "hour": 23,
  "distance_from_home_km": 50000,
  "is_international": true,
  "transactions_last_24h": 500,
  "merchant_risk": 1
}
```

Example response shape (the numeric result can vary with the trained model):

```json
{
  "fraud_probability": 0.8915,
  "risk_level": "HIGH",
  "recommended_action": "Flag for manual review",
  "signals": [
    "High transaction amount",
    "Transaction far from usual location",
    "International transaction",
    "High transaction frequency",
    "High-risk merchant category"
  ]
}
```

Try the live endpoint using the interactive [Swagger UI](https://ai-fraud-detection-api-0pm4.onrender.com/docs).

## Run locally

### 1. Backend

Python 3.11 is recommended.

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# Windows PowerShell
.venv\\Scripts\\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

Install dependencies, train the model, run tests, and start the API:

```bash
pip install -r requirements.txt
python train.py
pytest -q
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

### 2. Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, usually http://localhost:5173.

For a deployed or remote backend, configure `VITE_API_BASE_URL` to the API base URL before building the frontend. Do not add a trailing slash.

## Deployment

The live demo is deployed on Render as two services:

- **Backend:** Python web service running FastAPI.
- **Frontend:** Static site serving the Vite production build.

The repository includes a Render Blueprint for the backend. The frontend build needs the backend URL configured as `VITE_API_BASE_URL`. The backend's `CORS_ORIGINS` setting must include the exact dashboard origin.

Free hosting may spin down after inactivity, so the first request after a quiet period can take longer.

## Project structure

```text
.
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes and application setup
│   │   ├── model.py         # Model loading and signal explanations
│   │   └── schemas.py       # Request/response validation
│   ├── tests/               # API tests
│   ├── requirements.txt
│   └── train.py             # Synthetic data generation and training
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Transaction form and result display
│   │   ├── main.jsx
│   │   └── style.css
│   ├── index.html
│   └── package.json
├── docs/
│   └── architecture.md
└── render.yaml
```

## Model, evaluation, and limitations

The training script creates a deterministic synthetic dataset and trains a Random Forest model. The generated labels intentionally encode demo patterns such as unusually high amounts, late-night activity, international transactions, distance from home, transaction frequency, and merchant risk.

Because the data is synthetic:
- A high score is a demo risk estimate, not proof of fraud.
- Model metrics on this data do not establish real-world performance.
- The model may learn the synthetic label-generation rules rather than real fraud patterns.
- No real customer or payment data should be entered into this public demo.

A production-grade system would require appropriately licensed and anonymized data, time-aware validation, precision/recall/F1 and PR-AUC analysis, probability calibration, threshold governance, human review, drift monitoring, access controls, privacy safeguards, and audit logging.

## Future improvements

- Add a transaction history store and analytics view.
- Add model evaluation reports and explainability plots.
- Add rate limiting, structured logging, and stronger API security.
- Add CI checks for backend tests and frontend builds.
- Add screenshot-based product documentation.

## Repository

[GitHub repository](https://github.com/wajix07/AI-Fraud-Detection-System) · [GitHub profile](https://github.com/wajix07)

If you find this project useful, consider giving the repository a star.
