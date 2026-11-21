# System Architecture

## Overview

FraudShield AI is a small full-stack demonstration with a browser-based transaction form, a REST API, and a trained scikit-learn model.

## Runtime request flow

1. A user enters transaction attributes in the React dashboard.
2. The frontend sends a JSON request to the FastAPI `POST /predict` endpoint.
3. Pydantic validates the incoming fields.
4. The API loads the trained Random Forest model and calculates a fraud-risk probability.
5. The API maps the score to a risk band and recommended action, and prepares human-readable signals from the submitted attributes.
6. The dashboard displays the probability, risk level, recommended action, and signals.

## Training flow

1. `backend/train.py` generates a deterministic synthetic transaction dataset.
2. The training script fits a scikit-learn Random Forest classifier.
3. The trained model artifact is saved under `backend/artifacts/`.
4. The API loads that artifact to serve predictions.

The synthetic labels are deliberately generated from rule-like patterns. This makes the project reproducible and suitable for demonstrating an ML application workflow, but it does not establish that the model can detect real payment fraud.

## Main components

| Component | Responsibility |
|---|---|
| `frontend/src/App.jsx` | Transaction form, API request, result state |
| `frontend/src/style.css` | Dashboard styling and responsive layout |
| `backend/app/main.py` | FastAPI application, routes, CORS |
| `backend/app/schemas.py` | Input and output data validation |
| `backend/app/model.py` | Model loading, feature ordering, signal generation |
| `backend/train.py` | Synthetic data generation and model training |
| `backend/tests/` | Automated API checks |
| `render.yaml` | Backend Render Blueprint configuration |

## API surface

- `GET /` — service information.
- `GET /health` — health check.
- `GET /metrics` — demo model/service information, where configured.
- `POST /predict` — transaction risk prediction.

The authoritative interactive request and response schema is published by FastAPI at the live [Swagger UI](https://ai-fraud-detection-api-0pm4.onrender.com/docs).

## Deployment topology

- React/Vite frontend: [fraudshield-ai-dashboard.onrender.com](https://fraudshield-ai-dashboard.onrender.com)
- FastAPI backend: [ai-fraud-detection-api-0pm4.onrender.com](https://ai-fraud-detection-api-0pm4.onrender.com)

The frontend must point its `VITE_API_BASE_URL` setting to the backend origin. The backend must allow the exact frontend origin through `CORS_ORIGINS`.

## Security and responsible-use notes

This is a public educational demo. Do not submit personal, payment-card, account, or other sensitive data. The model is trained on synthetic data and must not be used to make real financial decisions. A production deployment would need authentication, authorization, rate limiting, privacy controls, secure secrets management, monitoring, audit trails, and rigorous validation on representative data.
