from pathlib import Path
import joblib
import pandas as pd

MODEL_PATH = Path(
    "ml/models/fraud_detector_v1.pkl"
)

THRESHOLD = 0.80


class FraudPredictor:

    def __init__(self):

        self.pipeline = joblib.load(
            MODEL_PATH
        )

    def predict(
        self,
        transaction: dict
    ):

        df = pd.DataFrame(
            [transaction]
        )

        probability = float(
            self.pipeline
            .predict_proba(df)[0][1]
        )

        prediction = int(
            probability >= THRESHOLD
        )

        return {
            "prediction": prediction,
            "fraud_probability": round(
                probability,
                6
            )
        }
