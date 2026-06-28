CSV Dataset
      │
      ▼
Kafka Producer
      │
      ▼
Kafka Topic (transactions)
      │
      ▼
Kafka Consumer
      │
      ▼
SQL Server
      │
      ▼
Airflow Pipeline
      │
      ▼
Feature Engineering
      │
      ▼
ML Model Training
      │
      ▼
Fraud Prediction API


CREATION OF DATASET FOR RETRAINING

Every Week
      ↓
training_feedback
      ↓
join transactions
      ↓
Give parquet
      ↓
retrain model



