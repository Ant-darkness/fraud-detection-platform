MACHINE LEARNING LALYER

Incoming Transaction
        ↓
      Kafka
        ↓
 ┌──────────────┐
 │ Raw Storage  │
 └──────────────┘
        ↓
 transactions_raw
        ↓
 Model Scoring
        ↓
 fraud_predictions
        ↓
 Analyst Review
        ↓
 fraud_labels
        ↓
 Retraining

 ANOTHER ONE
 Transaction

      |

      v

Kafka

      |

      +----------------+

      |                |

      v                v

transactions      fraud scoring table

                       |

                       v

             fraud_predictions

                       |

       probability > threshold

                       |

                       v

             fraud_review_queue


AIRFLOW structure

airflow/
│
├── dags/
│   └── fraud_retraining_dag.py
│
├── logs/
│
└── plugins/



