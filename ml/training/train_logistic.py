from pathlib import Path
import mlflow
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import (
    StratifiedKFold
)
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


EXPERIMENT_NAME = (
    "fraud_detection_baseline"
)


def main():

    print("Loading sample dataset...")

    df = pd.read_parquet(DATA_FILE)

    X = df.drop(
        columns=["isFraud"]
    )

    y = df["isFraud"]

    preprocessor = (
        build_preprocessor()
    )

    model = LogisticRegression(
        class_weight="balanced",
        max_iter=1000,
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
                f"Fold {fold + 1}"
            )

            X_train = X.iloc[
                train_idx
            ]

            X_valid = X.iloc[
                valid_idx
            ]

            y_train = y.iloc[
                train_idx
            ]

            y_valid = y.iloc[
                valid_idx
            ]

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

            results.append(
                metrics
            )

            print(metrics)

        summary = (
            summarize_results(
                results
            )
        )

        print("\nFINAL")

        print(summary)

        for k, v in summary.items():

            mlflow.log_metric(
                k,
                float(v)
            )

        mlflow.sklearn.log_model(
            sk_model=pipeline,
            name="logistic_fraud_detection"
        )


if __name__ == "__main__":
    main()
