┌─────────────────┐
│     React       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    FastAPI      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   SQL Server    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Kafka Producer  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      Kafka      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Kafka Consumer  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fraud Model     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Prediction DB   │
└─────────────────┘

    ▲

    │

┌─────────────────┐
│    Airflow      │
└─────────────────┘

# SUBS FLOWS FOR FRAUD LAYER

SQL Server
      ↓
Feature Engineering
      ↓
Train ML Model
      ↓
Save Model (.pkl)
      ↓
Real-time Scoring kupitia Kafka
      ↓
Fraud Alerts
      ↓
Dashboard


# MACHINE LEARNING LAYER

SQL Server
    |
    v
Feature Extraction
    |
    v
Train/Test Split
    |
    v
Cross Validation
    |
    v
LightGBM
    |
    v
Threshold Optimization
    |
    v
Metrics Logging
    |
    v
MLflow
    |
    v
Save:
    model.pkl
    encoder.pkl
    scaler.pkl
    threshold.pkl
