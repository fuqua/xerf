"""Utilities to load and cache earthquake datasets."""

from pathlib import Path
from typing import Optional

import pandas as pd


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"


def load_raw_dataset(filename: str) -> pd.DataFrame:
	"""Load a raw dataset CSV by filename from the raw data directory."""
	path = RAW_DIR / filename
	if not path.exists():
		raise FileNotFoundError(f"Dataset not found: {path}")
	return pd.read_csv(path)


def save_processed_dataset(df: pd.DataFrame, filename: str) -> Path:
	"""Persist a processed dataset to the processed directory."""
	PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
	path = PROCESSED_DIR / filename
	df.to_csv(path, index=False)
	return path


def load_processed_dataset(filename: str) -> Optional[pd.DataFrame]:
	"""Load a processed dataset if it exists, otherwise return None."""
	path = PROCESSED_DIR / filename
	if not path.exists():
		return None
	return pd.read_csv(path)
