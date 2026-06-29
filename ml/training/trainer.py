import joblib

from pathlib import Path

from sklearn.model_selection import train_test_split

from lightgbm import LGBMClassifier

from ml.data.preprocess import build_preprocessor


def train(df):
    """
    Receives a dataframe and trains a LightGBM model.
    Returns:
        model
        X_test
        y_test
    """

    # --------------------------
    # Separate features & target
    # --------------------------
    X = df.drop(columns=["isFraud"])
    y = df["isFraud"]

    # --------------------------
    # Train / Test Split
    # --------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    # --------------------------
    # Build preprocessing pipeline
    # (hamisha preprocessing yako hapa)
    # --------------------------
    preprocessor = build_preprocessor()

    # --------------------------
    # LightGBM
    # --------------------------
    model = LGBMClassifier(
        random_state=42
    )

    # Pipeline
    from sklearn.pipeline import Pipeline

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", model)
    ])

    pipeline.fit(X_train, y_train)

    # Save temporary model
    Path("ml/models").mkdir(parents=True, exist_ok=True)

    joblib.dump(
        pipeline,
        "ml/models/latest_model.pkl"
    )

    return pipeline, X_test, y_test
