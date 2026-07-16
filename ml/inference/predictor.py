import joblib
import os
import pandas as pd
import numpy as np
from backend.app.services.model_service import get_active_model
class FraudPredictor:
    def __init__(self):
        self.model = None
        self.model_path = None
        self.feature_cols = [
            "step", 
            "type", 
            "amount", 
            "oldbalanceOrg", 
            "newbalanceOrig", 
            "oldbalanceDest", 
            "newbalanceDest"
        ]
        self.reload_model()

    def reload_model(self):
        
        active = get_active_model()
        if active:
            model_id,model_path, name, version, desc, size = active
            path = model_path  
            if os.path.exists(path):
                self.model = joblib.load(path)
                self.model_path = path
                print(f"Loaded active model {name} v{version} successfully.")
            else:
                print(f"Model file not found at '{path}'. Using dummy model for now.")
                self.model = None
        else:
            print("No active model found in database. Using dummy model.")
            self.model = None

    def predict(self, transaction_data) -> dict:
        
        if isinstance(transaction_data, dict):
            
            cleaned_data = {col: transaction_data.get(col, 0) for col in self.feature_cols}
            features_df = pd.DataFrame([cleaned_data])
        elif isinstance(transaction_data, pd.DataFrame):
            
            features_df = transaction_data[self.feature_cols].copy()
        else:
            raise ValueError("Data Must be  Dictionary or Pandas DataFrame!")

        
        if self.model is None:
            return {
                "prediction": False,
                "fraud_probability": 0.1,  
                "features": features_df.to_dict(orient="records")[0]
            }

        try:
            
            if hasattr(self.model, "predict_proba"):
                proba = self.model.predict_proba(features_df)[0][1]
            else:
               
                pred_val = self.model.predict(features_df)[0]
                proba = 1.0 if pred_val else 0.0

            pred = proba >= 0.5  

            return {
                "prediction": bool(pred),
                "fraud_probability": float(proba),
                "features": features_df.to_dict(orient="records")[0]
            }

        except Exception as e:
            print(f"Error during model prediction: {e}. Falling back to dummy.")
            return {
                "prediction": False,
                "fraud_probability": 0.0,
                "error": str(e)
            }


predictor = FraudPredictor()
