#!/usr/bin/env python3
"""CLI entry-point to retrain the earthquake model."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from src.model_train import train_model

DEFAULT_DATASET = "earthquake_processed.csv"
DEFAULT_TARGET = "alert_binary"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Retrain the earthquake prediction model.")
    parser.add_argument(
        "--dataset",
        default=DEFAULT_DATASET,
        help="Processed dataset filename located under backend/data/processed",
    )
    parser.add_argument(
        "--target",
        default=DEFAULT_TARGET,
        help="Target column to predict in the dataset",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Test set proportion (0 < value < 1)",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    dataset_path = BACKEND_DIR / "data" / "processed" / args.dataset
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found at {dataset_path}. Ensure the processed CSV is present.")

    model, report = train_model(dataset_name=args.dataset, target_column=args.target, test_size=args.test_size)
    precision = report["weighted avg"]["precision"]
    recall = report["weighted avg"]["recall"]
    f1 = report["weighted avg"]["f1-score"]
    print(f"\nTraining complete: precision={precision:.3f}, recall={recall:.3f}, f1={f1:.3f}")
