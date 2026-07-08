

DROP TABLE IF EXISTS metric_registry CASCADE;
CREATE TABLE metric_registry (

    metric_id BIGSERIAL PRIMARY KEY,

    model_id BIGINT NOT NULL,

    precision_score DOUBLE PRECISION,

    recall_score DOUBLE PRECISION,

    f1_score DOUBLE PRECISION,

    roc_auc DOUBLE PRECISION,

    fraud_recall DOUBLE PRECISION,

    nonfraud_recall DOUBLE PRECISION,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_metric_model
        FOREIGN KEY (model_id)
        REFERENCES model_registry(model_id)
        ON DELETE CASCADE

);

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

    activated_by BIGINT,

    activated_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_model_activated_by
        FOREIGN KEY (activated_by)
        REFERENCES officers(officer_id)

);

DROP TABLE IF EXISTS fraud_review_queue CASCADE;
CREATE TABLE fraud_review_queue (

    review_id BIGSERIAL PRIMARY KEY,

    transaction_id VARCHAR(100) NOT NULL UNIQUE,

    fraud_probability DOUBLE PRECISION NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    reviewed_by BIGINT,

    reviewed_at TIMESTAMP,

    final_label BOOLEAN,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(transaction_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reviewed_by
        FOREIGN KEY (reviewed_by)
        REFERENCES officers(officer_id)

);

DROP TABLE IF EXISTS fraud_predictions CASCADE;
CREATE TABLE fraud_predictions (

    prediction_id BIGSERIAL PRIMARY KEY,

    transaction_id VARCHAR(100) NOT NULL UNIQUE,

    fraud_probability DOUBLE PRECISION NOT NULL,

    prediction BOOLEAN NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_prediction_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(transaction_id)
        ON DELETE CASCADE

);

DROP TABLE IF EXISTS transactions CASCADE;
CREATE TABLE transactions (

    transaction_id VARCHAR(100) PRIMARY KEY,

    step INTEGER NOT NULL,

    type VARCHAR(50) NOT NULL,

    amount DOUBLE PRECISION NOT NULL,

    nameOrig VARCHAR(100) NOT NULL,

    oldbalanceOrg DOUBLE PRECISION NOT NULL,

    newbalanceOrig DOUBLE PRECISION NOT NULL,

    nameDest VARCHAR(100) NOT NULL,

    oldbalanceDest DOUBLE PRECISION NOT NULL,

    newbalanceDest DOUBLE PRECISION NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',

    final_label BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

DROP TABLE IF EXISTS officers CASCADE;
CREATE TABLE officers (

    officer_id BIGSERIAL PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,

    full_name VARCHAR(100) NOT NULL,

    email VARCHAR(150) UNIQUE,

    password_hash TEXT NOT NULL,

    role VARCHAR(50) NOT NULL DEFAULT 'FRAUD_ANALYST',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,

    password_changed_at TIMESTAMP,

    last_login TIMESTAMP,

    created_by BIGINT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_created_by
        FOREIGN KEY (created_by)
        REFERENCES officers(officer_id)
        ON DELETE SET NULL

);

Threshold  Fraud Recall  Precision
0.20       95%           10%
0.40       85%           35%
0.60       70%           70%
0.80       45%           90%

npm install react-router-dom axios react-hook-form react-hot-toast recharts jwt-decode

npm install lucide-react

npm install -D tailwindcss @tailwindcss/vite


