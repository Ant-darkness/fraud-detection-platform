from pathlib import Path
import joblib
import pandas as pd

from lightgbm import LGBMClassifier
from sklearn.pipeline import Pipeline

from ml.feature_engineering.preprocessing import build_preprocessor
from ml.training.evaluate import evaluate_model
from ml.training.model_registry import (
    get_next_version,
    register_model
)


DATA_PATH = Path("ml/data/training_feedback.parquet")
MODEL_DIR = Path("ml/models")


def main():

    print("=" * 60)
    print("LOADING TRAINING DATA")
    print("=" * 60)

    df = pd.read_parquet(DATA_PATH)

    print(f"Dataset shape: {df.shape}")

    if len(df) < 1000:
        raise Exception("Not enough training data")

    X = df.drop(columns=["isFraud"])
    y = df["isFraud"]

    fraud_count = int(y.sum())
    non_fraud_count = int(len(y) - fraud_count)

    if fraud_count == 0:
        raise Exception("No fraud samples found in dataset")

    scale_pos_weight = non_fraud_count / fraud_count

    print(f"Fraud: {fraud_count}")
    print(f"Non-Fraud: {non_fraud_count}")
    print(f"scale_pos_weight: {scale_pos_weight:.2f}")

    print("=" * 60)
    print("BUILDING PIPELINE")
    print("=" * 60)

    preprocessor = build_preprocessor()

    model = LGBMClassifier(
        n_estimators=300,
        learning_rate=0.05,
        num_leaves=64,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        n_jobs=-1
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", model)
    ])

    print("=" * 60)
    print("TRAINING MODEL")
    print("=" * 60)

    pipeline.fit(X, y)

    print("=" * 60)
    print("EVALUATING MODEL")
    print("=" * 60)

    metrics = evaluate_model(pipeline, X, y)

    precision = metrics["precision"]
    recall = metrics["recall"]
    f1 = metrics["f1"]
    roc_auc = metrics["roc_auc"]

    print(metrics)

    print("=" * 60)
    print("SAVING MODEL")
    print("=" * 60)

    version = get_next_version()
    model_path = MODEL_DIR / f"fraud_detector_v{version}.pkl"

    joblib.dump(pipeline, model_path)

    print(f"Model saved at: {model_path}")

    print("=" * 60)
    print("REGISTERING MODEL")
    print("=" * 60)

    register_model(
        model_name="FraudDetector",
        version=version,
        model_path=str(model_path),
        dataset_size=len(df),
        precision_score=precision,
        recall_score=recall,
        f1_score=f1,
        roc_auc=roc_auc,
        
    )

    print("=" * 60)
    print("TRAINING COMPLETED SUCCESSFULLY")
    print("=" * 60)


if __name__ == "__main__":
    main()
