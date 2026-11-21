# AI-Powered Fraud Detection System

A portfolio-ready full-stack starter that scores card transactions for potential fraud. It includes a reproducible synthetic dataset, a scikit-learn model, a FastAPI REST API, a React dashboard, automated tests, and deployment configuration.

> **Important:** This is an educational demo using synthetic data. It must not be used to approve, decline, or investigate real financial transactions.

## Features
- Train a Random Forest classifier on generated transaction data.
- Return a fraud probability, risk band, recommended action, and transaction signals.
- FastAPI endpoints: `/`, `/health`, `/metrics`, and `/predict`.
- React dashboard to submit a transaction and view the prediction.
- Pytest API tests and GitHub Actions CI.
- Render backend deployment blueprint and Vercel frontend configuration.

## Architecture
```text
React dashboard (Vite) -> FastAPI REST API -> scikit-learn Random Forest
                                             ^
                                             |
                                  Synthetic training data
```

## Run locally

### Backend
Python 3.11 is recommended.

```bash
cd backend
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
python train.py
pytest -q
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

### Frontend
Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, usually http://localhost:5173. For a non-local API, set `VITE_API_BASE_URL` before building.

## Example API request
```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"amount":850,"hour":2,"distance_from_home_km":420,"is_international":true,"transactions_last_24h":8,"merchant_risk":0.8}'
```

## Deploy

### Backend on Render
The root-level `render.yaml` is a Blueprint for the FastAPI service. In Render, create a new Blueprint and select this repository. The service uses `backend/` as its root, installs Python requirements, trains the demo model during build, starts Uvicorn on Render's assigned port, and checks `/health`.

After deployment, copy the API's `onrender.com` URL.

### Frontend on Vercel
1. Import this GitHub repository into Vercel.
2. Set the project **Root Directory** to `frontend`.
3. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
4. Add environment variable `VITE_API_BASE_URL` with your Render backend URL (no trailing slash).
5. Deploy.

Then set the Render backend environment variable `CORS_ORIGINS` to your exact Vercel production URL (for example, `https://your-project.vercel.app`). Redeploy the backend after changing it.

Free Render web services can spin down after inactivity, so the first request after a quiet period may take longer.

## Model and data
`backend/train.py` generates a deterministic synthetic dataset and trains a Random Forest. The model is saved to `backend/artifacts/fraud_model.joblib`. The generated labels intentionally encode patterns such as unusually high amounts, late-night activity, international usage, distance from home, transaction frequency, and merchant risk. Because this is synthetic, model metrics are not evidence of real-world performance.

## Validation and responsible use
CI installs backend dependencies, trains the model, runs API tests, and builds the frontend. For a real fraud system, use a properly licensed and anonymized dataset, time-based splits, precision/recall/F1/PR-AUC, calibrated thresholds, human review, monitoring, access controls, and audit logs. Do not rely on accuracy alone.
