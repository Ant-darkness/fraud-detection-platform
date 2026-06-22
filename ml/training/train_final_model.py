from pathlib import Path
import joblib
import pandas as pd

from lightgbm import LGBMClassifier

from sklearn.pipeline import Pipeline

from ml.feature_engineering.preprocessing import (
    build_preprocessor
)


DATA_PATH = Path(
    "ml/data/fraud_training.parquet"
)

MODEL_PATH = Path(
    "ml/models/fraud_detector_v1.pkl"
)


def main():

    print("=" * 60)
    print("LOADING FULL DATASET")
    print("=" * 60)

    df = pd.read_parquet(DATA_PATH)

    print(f"Shape: {df.shape}")

    X = df.drop(
        columns=["isFraud"]
    )

    y = df["isFraud"]

    fraud_count = y.sum()

    non_fraud_count = (
        len(y) - fraud_count
    )

    scale_pos_weight = (
        non_fraud_count / fraud_count
    )

    print(
        f"Fraud: {fraud_count:,}"
    )

    print(
        f"Non Fraud: {non_fraud_count:,}"
    )

    print(
        f"scale_pos_weight: {scale_pos_weight:.2f}"
    )

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

    pipeline = Pipeline(
        [
            (
                "preprocessor",
                preprocessor
            ),
            (
                "model",
                model
            )
        ]
    )

    print("=" * 60)
    print("TRAINING FINAL MODEL")
    print("=" * 60)

    pipeline.fit(
        X,
        y
    )

    MODEL_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    joblib.dump(
        pipeline,
        MODEL_PATH
    )

    print("=" * 60)
    print("MODEL SAVED")
    print("=" * 60)

    print(
        MODEL_PATH
    )


if __name__ == "__main__":
    main()
