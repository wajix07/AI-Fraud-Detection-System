from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from app.model import FEATURES, MODEL_PATH

def build_dataset(n=12000, seed=42):
    rng = np.random.default_rng(seed)
    amount = rng.lognormal(mean=4.2, sigma=1.0, size=n).clip(1, 5000)
    hour = rng.integers(0, 24, size=n)
    distance = rng.exponential(scale=35, size=n).clip(0, 1500)
    international = rng.binomial(1, 0.12, size=n)
    frequency = rng.poisson(lam=2.2, size=n).clip(0, 20)
    merchant_risk = rng.beta(2, 5, size=n)
    # Synthetic target rule with noise: suitable only for a learning demo.
    logit = (
        -5.0 + 0.0012 * amount
        + 0.65 * (hour <= 5)
        + 0.0035 * distance
        + 1.0 * international
        + 0.20 * frequency
        + 2.4 * merchant_risk
    )
    probability = 1 / (1 + np.exp(-logit))
    labels = rng.binomial(1, probability)
    return pd.DataFrame({
        "amount": amount, "hour": hour, "distance_from_home_km": distance,
        "is_international": international, "transactions_last_24h": frequency,
        "merchant_risk": merchant_risk, "is_fraud": labels
    })

def main():
    df = build_dataset()
    X, y = df[FEATURES], df["is_fraud"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    model = RandomForestClassifier(
        n_estimators=250, max_depth=12, min_samples_leaf=3,
        class_weight="balanced", random_state=42, n_jobs=-1
    )
    model.fit(X_train, y_train)
    probabilities = model.predict_proba(X_test)[:, 1]
    predictions = (probabilities >= 0.5).astype(int)
    print(classification_report(y_test, predictions, zero_division=0))
    print("ROC-AUC:", round(roc_auc_score(y_test, probabilities), 4))
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")

if __name__ == "__main__":
    main()
