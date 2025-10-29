"""FastAPI app exposing earthquake prediction endpoint."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

APP_DIR = Path(__file__).resolve().parent
MODELS_DIR = APP_DIR.parent / "models"
MODEL_PATH = MODELS_DIR / "earthquake_model.joblib"

app = FastAPI(title="Earthquake Prediction API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictionRequest(BaseModel):
    magnitude: float = Field(..., description="Earthquake magnitude")
    depth: float = Field(..., description="Depth in km")
    cdi: float = Field(..., description="Community Decimal Intensity")
    mmi: float = Field(..., description="Modified Mercalli Intensity")
    sig: float = Field(..., description="Significance score")


class PredictionResponse(BaseModel):
    probability: float
    risk_category: str


@app.get("/wakeup")
def wakeup() -> dict[str, bool]:
    return {"is_awake": True}


@lru_cache(maxsize=1)
def load_model_artifacts() -> dict[str, Any]:
    if not MODEL_PATH.exists():
        raise FileNotFoundError("Model artifact not found. Train the model first.")
    return joblib.load(MODEL_PATH)


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest) -> PredictionResponse:
    try:
        artifacts = load_model_artifacts()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    model = artifacts["model"]
    scaler = artifacts.get("scaler") or artifacts.get("preprocess")
    if scaler is None:
        raise HTTPException(status_code=500, detail="Model artifact missing scaler/preprocess component.")
    features = [[payload.magnitude, payload.depth, payload.cdi, payload.mmi, payload.sig]]

    transformed = scaler.transform(features)
    probability = float(model.predict_proba(transformed)[0][1])
    risk_category = categorize_risk(probability)
    return PredictionResponse(probability=probability, risk_category=risk_category)


def categorize_risk(probability: float) -> str:
    if probability >= 0.7:
        return "high"
    if probability >= 0.4:
        return "medium"
    return "low"
