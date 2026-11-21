from pydantic import BaseModel, Field

class Transaction(BaseModel):
    amount: float = Field(ge=0, le=1_000_000)
    hour: int = Field(ge=0, le=23)
    distance_from_home_km: float = Field(ge=0, le=50_000)
    is_international: bool
    transactions_last_24h: int = Field(ge=0, le=500)
    merchant_risk: float = Field(ge=0, le=1)

class Prediction(BaseModel):
    fraud_probability: float
    risk_level: str
    recommended_action: str
    signals: list[str]
