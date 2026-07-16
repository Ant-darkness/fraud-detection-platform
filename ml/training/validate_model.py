from pathlib import Path
import joblib
import pandas as pd

from ml.training.metrics import calculate_metrics


DATA_PATH = Path("ml/data/training_feedback.parquet")


def main():

    latest_model = sorted(
        Path("ml/models").glob("fraud_detector_v*.pkl")
    )[-1]

    model = joblib.load(latest_model)

    df = pd.read_parquet(DATA_PATH)


    X = df.drop(columns=["isFraud"])
    y = df["isFraud"]

    y_pred = model.predict(X)
    y_prob = model.predict_proba(X)[:, 1]

    metrics = calculate_metrics(y, y_pred, y_prob)

    print(metrics)

    # STRICT VALIDATION RULES
    if (
        metrics["f1"] < 0.80 or
        metrics["recall"] < 0.70 or
        metrics["precision"] < 0.70
    ):
        raise Exception(
            f"Model rejected: {metrics}"
        )

    print("Model validation passed safely")
    return metrics


if __name__ == "__main__":
    main()
