from pathlib import Path

import joblib
import pandas as pd

from lightgbm import LGBMClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split

from ml.training.extract_training_data import load_training_data
from ml.feature_engineering.preprocessing import (
    build_preprocessor
)

from ml.training.evaluate import (
    evaluate_model
)

from ml.training.model_registry import (
    get_next_version,
    register_model
)


DATA_PATH = Path(
    "ml/data/fraud_training.parquet"
)

MODEL_DIR = Path(
    "ml/models"
)


def main():

    print("=" * 60)
    print("LOADING TRAINING DATA")
    print("=" * 60)

    df = pd.read_parquet(DATA_PATH)
    #df = load_training_data() in production

    print(f"Dataset shape: {df.shape}")

    if len(df) < 1000:
        raise Exception(
            "Not enough training data"
        )

    X = df.drop(
        columns=["isFraud"]
    )

    y = df["isFraud"]

    fraud_count = int(y.sum())
    non_fraud_count = int(
        len(y) - fraud_count
    )

    if fraud_count == 0:
        raise Exception(
            "No fraud samples found in dataset"
        )

    scale_pos_weight = (
        non_fraud_count / fraud_count
    )

    print(f"Fraud: {fraud_count}")
    print(f"Non-Fraud: {non_fraud_count}")
    print(
        f"scale_pos_weight: "
        f"{scale_pos_weight:.2f}"
    )

    print("=" * 60)
    print("TRAIN TEST SPLIT")
    print("=" * 60)

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
            stratify=y
        )
    )

    print("=" * 60)
    print("BUILDING PIPELINE")
    print("=" * 60)

    preprocessor = (
        build_preprocessor()
    )

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
        (
            "preprocessor",
            preprocessor
        ),
        (
            "model",
            model
        )
    ])

    print("=" * 60)
    print("TRAINING MODEL")
    print("=" * 60)

    pipeline.fit(
        X_train,
        y_train
    )

    print("=" * 60)
    print("EVALUATING MODEL")
    print("=" * 60)

    metrics = evaluate_model(
        pipeline,
        X_test,
        y_test
    )

    precision = metrics["precision"]
    recall = metrics["recall"]
    f1 = metrics["f1"]
    roc_auc = metrics["roc_auc"]

    print(metrics)

    print("=" * 60)
    print("SAVING MODEL")
    print("=" * 60)

    version = get_next_version()

    model_path = (
        MODEL_DIR /
        f"fraud_detector_v{version}.pkl"
    )

    joblib.dump(
        pipeline,
        model_path
    )

    print(
        f"Model saved at: {model_path}"
    )

    print("=" * 60)
    print("REGISTERING MODEL")
    print("=" * 60)

    register_model(
        model_name="FraudDetector",
        version=version,
        metrics=metrics,
        model_path=model_path.as_posix(),
        dataset_size=len(df)
    )

    print("=" * 60)
    print("TRAINING COMPLETED")
    print("=" * 60)

    print(f"Version: {version}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F1: {f1:.4f}")
    print(f"ROC_AUC: {roc_auc:.4f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
