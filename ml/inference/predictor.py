from pathlib import Path, PureWindowsPath
import joblib
import numpy as np
import pandas as pd
from backend.app.database.connection import get_connection


class FraudPredictor:
    def __init__(self):
        
        self.model = self.load_active_model()
        
    #def load_active_model(self):
    #    conn = get_connection()
        
    #    try:
    #        cursor = conn.cursor()
    #        cursor.execute("""
    #                    SELECT model_path
    #                    FROM model_registry
    #                    WHERE is_active = TRUE""")
            
    #        row = cursor.fetchone()
            
    #        if row is None:
    #            raise Exception("No active model found.")
            
    #        model_path = Path(PureWindowsPath(row[0]))
            
    #        if not model_path.is_absolute():
    #            model_path = Path("/app") / model_path
            
    #        print(f"Loading model: {model_path}")
            
    #        return joblib.load(model_path)
    #    finally:
    #        cursor.close()
    #        conn.close()
    
    
    def reload_model(self):
        self.model = self.load_active_model()
        

    def predict(self, features):

        # always ensure DataFrame is 2D correct shape
        if not isinstance(features, pd.DataFrame):
            features = pd.DataFrame([features])

        # FORCE no nested structure issues
        features = features.copy()

        prob = self.model.predict_proba(features)[:, 1][0]

        prediction = int(prob >= 0.9)
        label = "Fraud" if prediction else "Not Fraud"

        return {
            "prediction": prediction,
            "prediction_label": label,
            "fraud_probability": float(prob)
        }

    def load_active_model(self):

        conn = get_connection()

        try:

            cursor = conn.cursor()

            cursor.execute("""
                SELECT model_path
                FROM model_registry
                WHERE is_active = TRUE
            """)

            row = cursor.fetchone()

            if row is None:
                raise Exception("No active model found.")

            db_path = Path(row[0])

            
            PROJECT_ROOT = Path(__file__).resolve().parents[2]

            if not db_path.is_absolute():
                model_path = PROJECT_ROOT / db_path
            else:
                model_path = db_path

            model_path = model_path.resolve()

            print(f"Loading model: {model_path}")

            if not model_path.exists():
                raise FileNotFoundError(
                    f"Model not found:\n{model_path}"
                )

            return joblib.load(model_path)

        finally:
            cursor.close()
            conn.close()
      
predictor = FraudPredictor()
