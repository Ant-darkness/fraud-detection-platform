MODEL RETRAIN FLOW

Extract Feedback
        │
        ▼
Train Model
        │
        ▼
Validate Model
        │
        ▼
Activate Model


DEEP

Airflow train model
        │
        ▼
register_model()
        │
        ▼
activate_model()
        │
        ▼
POST /model/reload
        │
        ▼
FraudPredictor.load_active_model()
