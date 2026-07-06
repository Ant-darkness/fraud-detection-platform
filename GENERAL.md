Data Warehouse
        ↓
Kafka
        ↓
transactions
        ↓
LightGBM
        ↓
fraud_predictions
        ↓
High Risk
        ↓
fraud_review_queue
        ↓
BoT Officer
        ↓
training_feedback
        ↓
Airflow Weekly
        ↓
Retrain
        ↓
fraud_detector_v2.pkl
        ↓
Production



Customer Transaction
        │
        ▼
Kafka
        │
        ├──────────────► PostgreSQL (transactions)
        │
        ▼
Fraud Predictor
        │
        ▼
fraud_predictions
        │
        ▼
Threshold
        │
        ▼
fraud_review_queue
        │
        ▼
Officer Review
        │
        ▼
training_feedback.parquet
        │
        ▼
Airflow Retraining




PIPELINE


extract reviewed data
        │
        ▼
train model
        │
        ▼
evaluate
        │
        ▼
register model
        │
        ▼
activate model
        │
        ▼
reload api

Transaction

        │

        ▼

transactions

        │

        ▼

Prediction

        │

        ▼

fraud_predictions

        │

        ▼

Officer reviews

        │

        ▼

fraud_review_queue

        │

        ▼

Extract reviewed data

        │

        ▼

fraud_training.parquet

        │

        ▼

Train Model
