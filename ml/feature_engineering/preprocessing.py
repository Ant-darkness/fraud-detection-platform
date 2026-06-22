from pathlib import Path

import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline


DATA_PATH = Path("backend/ml/fraud_training.parquet")


NUMERIC_FEATURES = [
    "step",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest"
]

CATEGORICAL_FEATURES = [
    "type"
]


def load_data():

    df = pd.read_parquet(DATA_PATH)

    X = df.drop(columns=["isFraud"])

    y = df["isFraud"]

    return X, y


def build_preprocessor():

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False
                ),
                CATEGORICAL_FEATURES
            )
        ],
        remainder="passthrough"
    )

    return preprocessor
