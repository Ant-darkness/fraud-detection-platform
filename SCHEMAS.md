DATABASE SCHEMA
DATABASE_NAME -> FraudDB

TRANSACTIONS TABLE

```PostgreSQL
DROP TABLE IF EXISTS transactions CASCADE;
CREATE TABLE transactions (

    transaction_id BIGSERIAL PRIMARY KEY,

    step INTEGER NOT NULL,

    type VARCHAR(50) NOT NULL,

    amount DOUBLE PRECISION NOT NULL,

    nameOrig VARCHAR(100) NOT NULL,

    oldbalanceOrg DOUBLE PRECISION NOT NULL,

    newbalanceOrig DOUBLE PRECISION NOT NULL,

    nameDest VARCHAR(100) NOT NULL,

    oldbalanceDest DOUBLE PRECISION NOT NULL,

    newbalanceDest DOUBLE PRECISION NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
```
FRAUD_PREDICTIONS TABLE
```PostgreSQL
DROP TABLE IF EXISTS fraud_predictions CASCADE;
CREATE TABLE fraud_predictions (

    prediction_id BIGSERIAL PRIMARY KEY,

    transaction_id BIGINT NOT NULL,

    fraud_probability DOUBLE PRECISION NOT NULL,

    prediction BOOLEAN NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_prediction_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(transaction_id)
        ON DELETE CASCADE

);
```

OFFICERS TABLE

```PostgreSQL
DROP TABLE IF EXISTS officers CASCADE;

CREATE TABLE officers (

    officer_id SERIAL PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    username VARCHAR(50) UNIQUE NOT NULL,

    email VARCHAR(150) UNIQUE,

    password_hash TEXT NOT NULL,

    role VARCHAR(30) DEFAULT 'REVIEWER',

    is_active BOOLEAN DEFAULT TRUE,

    create_by INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    must_change_password BOOLEAN DEFAULT TRUE,

    password_changed_at TIMESTAMP,

    last_login TIMESTAMP,

    CONSTRAINT fk_created_by
    FOREIGN KEY(created_by)
    REFENCES officer(officer_id)
);
```

MODEL_REGISTRY TABLE
```PostgreSQL
DROP TABLE IF EXISTS model_registry CASCADE;
CREATE TABLE model_registry (

    model_id BIGSERIAL PRIMARY KEY,

    model_name VARCHAR(100) NOT NULL,

    model_version INTEGER NOT NULL UNIQUE,

    model_path VARCHAR(500) NOT NULL,

    dataset_size INTEGER,

    model_description TEXT,

    is_active BOOLEAN DEFAULT FALSE,

    activation_status VARCHAR(30) DEFAULT 'PENDING',

    activated_by BIGINT REFERENCES officers(officer_id),

    activated_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
```

METRIC_REGISRTY TABLE
```PostgreSQL
DROP TABLE IF EXISTS metric_registry CASCADE;
CREATE TABLE metric_registry (

    metric_id BIGSERIAL PRIMARY KEY,

    model_id BIGINT NOT NULL
        REFERENCES model_registry(model_id)
        ON DELETE CASCADE,

    precision_score DOUBLE PRECISION,

    recall_score DOUBLE PRECISION,

    f1_score DOUBLE PRECISION,

    roc_auc DOUBLE PRECISION,

    fraud_recall DOUBLE PRECISION,

    nonfraud_recall DOUBLE PRECISION,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
```


FRAUD_REVIEW_QUEUE TABLE
```PostgreSQL
DROP TABLE IF EXISTS fraud_review_queue CASCADE;
CREATE TABLE fraud_review_queue (

    review_id BIGSERIAL PRIMARY KEY,

    transaction_id BIGINT NOT NULL,

    fraud_probability DOUBLE PRECISION NOT NULL,

    status VARCHAR(20) DEFAULT 'PENDING',

    reviewed_by BIGINT REFERENCES officers(officer_id),

    reviewed_at TIMESTAMP,

    final_label BOOLEAN,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(transaction_id)
        ON DELETE CASCADE

);
```

TRAINING_RUNS TABLE
```PostgreSQL
CREATE TABLE training_runs (

    run_id BIGSERIAL PRIMARY KEY,

    model_version INTEGER,

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    finished_at TIMESTAMP,

    status VARCHAR(20),

    message TEXT

);
```



INDEXES

```PostgreSQL
CREATE INDEX idx_transactions_created_at
ON transactions(created_at);
```

```PostgreSQL
CREATE INDEX idx_predictions_transaction
ON fraud_predictions(transaction_id);
```

```PostgreSQL
CREATE INDEX idx_predictions_created_at
ON fraud_predictions(created_at);
```

```PostgreSQL
CREATE INDEX idx_review_status
ON fraud_review_queue(status);
```

```PostgreSQL
CREATE INDEX idx_review_transaction
ON fraud_review_queue(transaction_id);
```

```PostgreSQL
CREATE INDEX idx_model_active
ON model_registry(is_active);
```

CONSTRAINTS
-Helps to disallow incorrect or unfamiliar data to enter to our database

FRAUD_REVIEW_QUEUE TABLE

```PostgreSQL
ALTER TABLE fraud_review_queue
ADD CONSTRAINT chk_review_status
CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
```
```PostgreSQL
ALTER TABLE fraud_review_queue
ADD CONSTRAINT uq_review_transaction
UNIQUE(transaction_id);
```

FRAUD_PREDICTIONS TABLE

```PostgreSQL
ALTER TABLE fraud_predictions
ADD CONSTRAINT chk_probability
CHECK (
    fraud_probability >= 0
    AND fraud_probability <= 1
);
```



```PostgreSQL
```

```PostgreSQL
```



DATABASE COMMANDS TRICKS FOR POSTGRESQL

SHOW TABLE
`\dt`

SHOW TABLE SCHEMA
`\d transactions` or `\d fraud_predictions`

KUTOKA TABLE

`\q`


