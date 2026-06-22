Historical Data
                           ↓
                    SQL Server
                           ↓
                    Feature Store
                           ↓
                    ML Training
                           ↓
                  fraud_model.pkl
                           ↓
─────────────────────────────────────────

New Transaction
       ↓
Kafka Producer
       ↓
Kafka Topic
       ↓
Inference Consumer
       ↓
ML Model Prediction
       ↓
Fraud Score
       ↓
SQL Server
       ↓
Dashboard / API / Alerts



fraud-detection-platform/

│
├── airflow/
│   ├── dags/
│   ├── plugins/
│   ├── logs/
│   └── config/
│
├── backend/
│   ├── app/
│   │
│   ├── api/
│   ├── services/
│   ├── models/
│   ├── schemas/
│   ├── database/
│   ├── kafka/
│   ├── utils/
│   │
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│
├── ml/
│   ├── training/
│   ├── inference/
│   ├── feature_engineering/
│   ├── pipelines/
│   ├── models/
│   ├── artifacts/
│   └── notebooks/
│
├── kafka/
│   ├── producer/
│   └── consumer/
│
├── database/
│   ├── scripts/
│   ├── procedures/
│   ├── views/
│   └── backups/
│
├── monitoring/
│   ├── prometheus/
│   └── grafana/
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── external/
│
├── docs/
│
├── .env
├── docker-compose.yml
├── requirements.txt
└── README.md

PRODUCTION ARCHITECTURE

Producer
   ↓
Kafka Topic (transactions)
   ↓
Scoring Consumer
   ↓
LightGBM Model
   ↓
Fraud Probability
   ↓
Prediction Table
   ↓
Dashboard / API
