DATABASE SCHEMA
Name -> FraudDB

TRANSACTIONS TABLE
```MS
CREATE TABLE transactions (

    transaction_id BIGINT IDENTITY(1,1) PRIMARY KEY,

    step INT NOT NULL,

    type VARCHAR(50) NOT NULL,

    amount FLOAT NOT NULL,

    oldbalanceOrg FLOAT NOT NULL,

    newbalanceOrig FLOAT NOT NULL,

    oldbalanceDest FLOAT NOT NULL,

    newbalanceDest FLOAT NOT NULL,

    created_at DATETIME DEFAULT GETDATE()

);
```

FRAUD_PREDICTIONS TABLE
```MS
CREATE TABLE fraud_predictions (

    prediction_id BIGINT IDENTITY(1,1) PRIMARY KEY,

    transaction_id BIGINT NOT NULL,

    fraud_probability FLOAT NOT NULL,

    prediction BIT NOT NULL,

    scored_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_fraud_predictions_transaction
    FOREIGN KEY (transaction_id)
    REFERENCES transactions(transaction_id)

);
```


FRAUD_REVIEW_QUEUE TABLE
```MS
CREATE TABLE fraud_review_queue (

    review_id BIGINT IDENTITY(1,1) PRIMARY KEY,

    transaction_id BIGINT NOT NULL,

    fraud_probabiblity FLOAT NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    reviewed_by VARCHAR(100) NULL,

    reviewed_at DATETIME NULL,

    final_label BIT NULL,

    CONSTRAINT FK_review_queue_transaction
    FOREIGN KEY (transaction_id)
    REFERENCES transactions(transaction_id)

);
```


TRAINING_FEEDBACK TABLE

```MS
CREATE TABLE training_feedback (

    feedback_id BIGINT IDENTITY(1,1) PRIMARY KEY,

    transaction_id BIGINT NOT NULL,

    final_label INT NOT NULL,

    reviewed_by VARCHAR(100),

    reviewed_at DATETIME,

    created_at DATETIME DEFAULT GETDATE()

);
```


MODEL_REGISTRY TABLE

```MS
CREATE TABLE model_registry (
    model_id BIGINT IDENTITY(1,1) PRIMARY KEY,

    model_name VARCHAR(100) NOT NULL,

    model_version INT NOT NULL,

    model_path VARCHAR(500) NOT NULL,

    dataset_size BIGINT,

    precision_score FLOAT,

    recall_score FLOAT,

    f1_score FLOAT,

    roc_auc FLOAT,

    is_active BIT DEFAULT 0,

    created_at DATETIME DEFAULT GETDATE());
```
