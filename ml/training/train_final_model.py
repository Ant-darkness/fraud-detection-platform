import os
import requests
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

from lightgbm import LGBMClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split

from ml.feature_engineering.preprocessing import build_preprocessor
from ml.training.evaluate import evaluate_model
from ml.training.model_registry import get_next_version, register_model
from ml.training.metric_registry import register_metrics
from ml.training.training_run import start_run, finish_run, fail_run
from backend.app.database.connection import get_connection

# Hakikisha Path inasoma vizuri kuanzia Project Root
BASE_DIR = Path(__file__).resolve().parents[2]
DATA_PATH = BASE_DIR / "ml" / "data" / "fraud_training.parquet"
MODEL_DIR = BASE_DIR / "ml" / "models"

# Mawasiliano ya Docker Network na agentic-service
AGENTIC_SERVICE_URL = os.getenv(
    "AGENT_SERVICE_URL", "http://agentic-service:8001")


def call_model_audit_agent(model_id: int, metrics: dict):
    """Inatuma ombi kwa agentic-service ili AI iandike description na kuisave DB."""
    url = f"{AGENTIC_SERVICE_URL}/agent/model-audit"
    payload = {
        "model_id": model_id,
        "metrics": {
            "precision": float(metrics.get("precision", 0.0)),
            "recall": float(metrics.get("recall", 0.0)),
            "f1_score": float(metrics.get("f1", 0.0)),
            "roc_auc": float(metrics.get("roc_auc", 0.0))
        }
    }

    try:
        print(
            f"🤖 Inatuma metrics kwa ModelAuditAgent [Model ID: {model_id}]...")
        res = requests.post(url, json=payload, timeout=30.0)
        if res.status_code == 200:
            print("✅ ModelAuditAgent imefanikiwa kutengeneza na kuhifadhi description!")
        else:
            print(f"⚠️ Agent Error ({res.status_code}): {res.text}")
    except Exception as e:
        print(f"⚠️ Imeshindikana kuwasiliana na ModelAuditAgent: {str(e)}")


def get_best_existing_model_metrics():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT mr.model_version,
               mm.f1_score
        FROM model_registry mr
        JOIN metric_registry mm ON mr.model_id = mm.model_id
        WHERE mr.is_active = TRUE
        ORDER BY mr.created_at DESC
        LIMIT 1
    """)

    row = cur.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "version": row[0],
        "f1": row[1]
    }


def main(data_path=DATA_PATH):
    run_id = None

    try:
        df = pd.read_parquet(data_path)

        if len(df) < 1000:
            raise Exception("Not enough training data")

        X = df.drop(columns=["isFraud"])
        y = df["isFraud"]

        fraud_count = int(y.sum())
        total_count = len(y)
        if fraud_count == 0:
            raise Exception("No fraud samples found")

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        preprocessor = build_preprocessor()

        # -------------------------------------------------------------
        # 🎯 TUNING: KUBORESHA PRECISION BILA KUPOTEZA RECALL SANA
        # -------------------------------------------------------------
        # Badala ya kutumia raw ratio (kama 100+), tunatumia Square Root
        # au capping ili kuzuia Model isidanganye na Precision ya 2%
        raw_weight = (total_count - fraud_count) / fraud_count
        tuned_weight = min(np.sqrt(raw_weight) * 1.5, 15.0)

        model = LGBMClassifier(
            n_estimators=300,
            learning_rate=0.03,
            num_leaves=31,
            max_depth=6,
            min_child_samples=50,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=tuned_weight,  # Swapped na tuned weight
            random_state=42,
            n_jobs=-1
        )

        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("model", model)
        ])

        print(
            f"🔄 Inatrain Model... (Dataset Size: {total_count}, Fraud: {fraud_count}, Weight: {tuned_weight:.2f})")
        pipeline.fit(X_train, y_train)

        metrics = evaluate_model(pipeline, X_test, y_test)
        new_f1 = metrics["f1"]

        best_model = get_best_existing_model_metrics()
        best_f1 = best_model["f1"] if best_model else 0

        version = get_next_version()
        run_id = start_run(version)

        # -------------------------------------------------------------
        # 1. HAKIKISHA FOLDER LIPO KWANZA NA SAJILI FILE SAFE
        # -------------------------------------------------------------
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        model_file_path = MODEL_DIR / f"fraud_detector_v{version}.pkl"

        # Relative path ya kuisave kwenye DB
        relative_db_path = f"ml/models/fraud_detector_v{version}.pkl"

        print(f"💾 Inahifadhi model file kwenda: {model_file_path}")
        joblib.dump(pipeline, model_file_path)

        if not model_file_path.exists():
            raise FileNotFoundError(
                f"Model file could not be created at {model_file_path}")

        print("✅ Model file imesave-wa kikamilifu kwenye disk!")

        # -------------------------------------------------------------
        # 2. DB REGISTRATION & METRICS
        # -------------------------------------------------------------
        model_id = register_model(
            model_name=f"FraudDetector_v{version}",
            version=version,
            model_path=relative_db_path,
            dataset_size=len(df),
            description="Inasubiri uchambuzi wa AI Agent..."
        )

        register_metrics(model_id=model_id, metrics=metrics)

        # 🤖 ITWA AGENT
        call_model_audit_agent(model_id=model_id, metrics=metrics)

        # AUTO PROMOTION LOGIC
        if new_f1 > best_f1:
            print(
                f"🚀 New model v{version} (F1: {new_f1:.4f}) is better than best (F1: {best_f1:.4f}) → eligible for activation")
        else:
            print(
                f"⚠️ New model v{version} (F1: {new_f1:.4f}) is weaker than best (F1: {best_f1:.4f}) → NOT activating")

        finish_run(run_id)
        print("🎉 Training completed safely!")

    except Exception as e:
        if run_id:
            fail_run(run_id, str(e))
        print(f"❌ Training Failed: {str(e)}")
        raise


if __name__ == "__main__":
    main()
