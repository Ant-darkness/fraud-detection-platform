from pathlib import Path
import joblib
import mlflow
import mlflow.xgboost
import pandas as pd

from xgboost import XGBClassifier

from sklearn.pipeline import Pipeline
from sklearn.model_selection import StratifiedKFold

from ml.feature_engineering.preprocessing import (
    build_preprocessor
)

from ml.training.metrics import (
    calculate_metrics
)

from ml.training.evaluate import (
    summarize_results
)


DATA_FILE = Path(
    "ml/data/train_sample.parquet"
)

MODEL_PATH = Path(
    "ml/models/xgboost_v1.pkl"
)

EXPERIMENT_NAME = (
    "fraud_detection_xgboost"
)


def main():

    df = pd.read_parquet(DATA_FILE)

    X = df.drop(
        columns=["isFraud"]
    )

    y = df["isFraud"]

    fraud_count = y.sum()
    non_fraud_count = len(y) - fraud_count

    scale_pos_weight = (
        non_fraud_count / fraud_count
    )

    preprocessor = (
        build_preprocessor()
    )

    model = XGBClassifier(

        n_estimators=300,

        max_depth=6,

        learning_rate=0.05,

        subsample=0.8,

        colsample_bytree=0.8,

        scale_pos_weight=scale_pos_weight,

        eval_metric="logloss",

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

    cv = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42
    )

    mlflow.set_experiment(
        EXPERIMENT_NAME
    )

    results = []

    with mlflow.start_run():

        for fold, (
            train_idx,
            valid_idx
        ) in enumerate(
            cv.split(X, y)
        ):

            print(
                f"Fold {fold+1}"
            )

            X_train = X.iloc[train_idx]
            X_valid = X.iloc[valid_idx]

            y_train = y.iloc[train_idx]
            y_valid = y.iloc[valid_idx]

            pipeline.fit(
                X_train,
                y_train
            )

            y_pred = pipeline.predict(
                X_valid
            )

            y_prob = (
                pipeline.predict_proba(
                    X_valid
                )[:, 1]
            )

            metrics = (
                calculate_metrics(
                    y_valid,
                    y_pred,
                    y_prob
                )
            )

            print(metrics)

            results.append(
                metrics
            )

        summary = summarize_results(
            results
        )

        print("\nFINAL")
        print(summary)

        for k, v in summary.items():

            mlflow.log_metric(
                k,
                float(v)
            )

        mlflow.xgboost.log_model(
            pipeline.named_steps["model"],
            name="xgboost_fraud_detector"
        )

    MODEL_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    joblib.dump(
        pipeline,
        MODEL_PATH
    )

    print(
        f"Saved -> {MODEL_PATH}"
    )


if __name__ == "__main__":
    main()
