                    GENERAL
Postgres
        ▲
        │
        │ metrics
        │
Airflow DAG
        │
        ▼
Model Registry
        │
        ▼
Fraud API
        │
        ▼
Dashboard

            IN DEEP

Extract Dataset
        │
        ▼
Validate Dataset
        │
        ▼
Train Model
        │
        ▼
Evaluate Model
        │
        ▼
Save Model (.pkl)
        │
        ▼
Register Model
        │
        ▼
Store Metrics
        │
        ▼
Compare With Active Model
        │
        ├────────► Worse
        │             │
        │             ▼
        │      status=REJECTED
        │
        ▼
Better
        │
        ▼
Auto Activate
        │
        ▼
Reload Predictor
        │
        ▼
Notify Dashboard
