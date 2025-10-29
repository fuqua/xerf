"""Feature engineering and preprocessing utilities."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


@dataclass
class PreprocessedData:
	features: np.ndarray
	labels: np.ndarray
	feature_columns: list[str]


class SeismicFeatureEngineer(TransformerMixin, BaseEstimator):
	"""Generate rolling-window seismic features."""

	def __init__(self, window_hours: int = 24) -> None:
		self.window_hours = window_hours

	def fit(self, X: pd.DataFrame, y: pd.Series | None = None) -> "SeismicFeatureEngineer":
		return self

	def transform(self, X: pd.DataFrame) -> pd.DataFrame:
		df = X.copy()
		rolling = df.sort_values("timestamp").rolling(f"{self.window_hours}H", on="timestamp")
		df["mag_mean"] = rolling["magnitude"].mean()
		df["depth_mean"] = rolling["depth"].mean()
		df["event_count"] = rolling["magnitude"].count()
		df.fillna(method="bfill", inplace=True)
		return df.drop(columns=["timestamp"])


def build_preprocessing_pipeline() -> Pipeline:
	return Pipeline(steps=[
		("features", SeismicFeatureEngineer()),
		("scaler", StandardScaler()),
	])


def split_features_labels(df: pd.DataFrame, target_column: str) -> Tuple[pd.DataFrame, pd.Series]:
	if target_column not in df.columns:
		raise KeyError(f"Missing target column: {target_column}")
	X = df.drop(columns=[target_column])
	y = df[target_column]
	return X, y
