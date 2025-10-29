"""Model training entry points."""

from __future__ import annotations

from pathlib import Path
from typing import Tuple

import joblib
import pandas as pd
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from .data_loader import load_processed_dataset, save_processed_dataset
from .preprocess import split_features_labels

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_PATH = MODELS_DIR / "earthquake_model.joblib"


def train_model(dataset_name: str, target_column: str, test_size: float = 0.2) -> Tuple[XGBClassifier, dict]:
	df = load_processed_dataset(dataset_name)
	if df is None:
		raise FileNotFoundError("Processed dataset not found. Run preprocessing first.")

	X, y = split_features_labels(df, target_column)
	X_train, X_test, y_train, y_test = train_test_split(
		X,
		y,
		test_size=test_size,
		stratify=y,
		random_state=42,
	)

	scaler = StandardScaler()
	X_train_scaled = scaler.fit_transform(X_train)
	X_test_scaled = scaler.transform(X_test)

	model = XGBClassifier(
		objective="binary:logistic",
		eval_metric="logloss",
		max_depth=6,
		learning_rate=0.05,
		n_estimators=300,
		subsample=0.8,
		colsample_bytree=0.8,
		random_state=42,
		use_label_encoder=False,
	)
	model.fit(X_train_scaled, y_train, verbose=False)

	y_pred = model.predict(X_test_scaled)
	report = classification_report(y_test, y_pred, output_dict=True)

	MODELS_DIR.mkdir(parents=True, exist_ok=True)
	artifacts = {
		"model": model,
		"scaler": scaler,
		"feature_names": X.columns.tolist(),
	}
	joblib.dump(artifacts, MODEL_PATH)

	return model, report


def preprocess_and_cache(df: pd.DataFrame, filename: str) -> None:
	"""Persist cleaned dataset to speed up training loops."""
	save_processed_dataset(df, filename)
