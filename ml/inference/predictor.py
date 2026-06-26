from pathlib import Path 
import joblib
from backend.app.database.connection import get_connection


class FraudPredictor:
    def __init__(self):
        
        self.model = self.load_active_model()
        
    def load_active_model(self):
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
                       SELECT model_path
                       FROM model_registry
                       WHERE is_active = 1""")
        
        row = cursor.fetchone()
        
        if row is None:
            raise Exception("No active model found.")
        
        model_path = Path(row.model_path)
        
        print(f"Loading model: {model_path}")
        
        return joblib.load(model_path)
    
    def reload_model(self):
        self.model = self.load_active_model()
        
    def predict(self, features):
        probability = self.model.predict_proba([features])[0][1]
        
        prediction = int(probability >= 0.5)
        
        return {
            "prediction": prediction,
            "fraud_probability": float(probability)
        }
        
        
predictor = FraudPredictor()
