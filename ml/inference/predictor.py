from pathlib import Path, PureWindowsPath
import joblib
import pandas as pd
from backend.app.database.connection import get_connection


class FraudPredictor:
    def __init__(self):
        
        self.model = self.load_active_model()
        
    def load_active_model(self):
        conn = get_connection()
        
        try:
            cursor = conn.cursor()
            cursor.execute("""
                        SELECT model_path
                        FROM model_registry
                        WHERE is_active = TRUE""")
            
            row = cursor.fetchone()
            
            if row is None:
                raise Exception("No active model found.")
            
            model_path = Path(PureWindowsPath(row[0]))
            
            if not model_path.is_absolute():
                model_path = Path("/app") / model_path
            
            print(f"Loading model: {model_path}")
            
            return joblib.load(model_path)
        finally:
            cursor.close()
            conn.close()
    
    
    def reload_model(self):
        self.model = self.load_active_model()
        
    def predict(self, features):
        features = pd.DataFrame([features])
        probability = self.model.predict_proba(features)[0][1]
        
        prediction = int(probability >= 0.5)
        label = "Fraud" if prediction else "Not Fraud"
        
        return {
            "prediction": prediction,
            "prediction_label": label,
            "fraud_probability": float(probability)
        }
        
      
predictor = FraudPredictor()
