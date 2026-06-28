Producer
      │
      ▼
Kafka
      │
      ▼
Consumer
      │
      ├────────► transactions
      │
      ├────────► fraud_predictions
      │
      └────────► fraud_review_queue (probability >= threshold)
                         │
                         ▼
                 Officer approves/rejects
                         │
                         ▼
                extract_training_data.py
                         │
                         ▼
              training_feedback.parquet
                         │
                         ▼
                 train_final_model.py
                         │
                         ▼
                 model_registry
                         │
                         ▼
                 activate_model.py
                         │
                         ▼
                  reload_api.py
                         │
                         ▼
            Predictor uses new active model



