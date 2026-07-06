-- 1. Table ya Maafisa (Officers) wanaofanya Review
CREATE TABLE officers (
    officer_id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'FRAUD_ANALYST',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table Kuu ya Miamala (Transactions)
CREATE TABLE transactions (
    transaction_id VARCHAR(100) PRIMARY KEY, -- ID inatoka Kafka (Inashauriwa VARCHAR badala ya SERIAL kwa IDs za miamala)
    step INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    nameOrig VARCHAR(100) NOT NULL,
    oldbalanceOrg DOUBLE PRECISION NOT NULL,
    newbalanceOrig DOUBLE PRECISION NOT NULL,
    nameDest VARCHAR(100) NOT NULL,
    oldbalanceDest DOUBLE PRECISION NOT NULL,
    newbalanceDest DOUBLE PRECISION NOT NULL,
    status VARCHAR(20) DEFAULT 'APPROVED', -- Thamani: 'APPROVED', 'HELD', 'REJECTED'
    final_label BOOLEAN DEFAULT FALSE,     -- FALSE = Salama, TRUE = Fraud (Baada ya review au prediction)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table ya Maamuzi ya Model (Fraud Predictions) kwa ajili ya Analytics
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

-- 4. Table ya Queue ya Kuzuia Miamala (Fraud Review Queue)
CREATE TABLE fraud_review_queue (
    review_id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    fraud_probability DOUBLE PRECISION NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',  -- Thamani: 'PENDING', 'APPROVED', 'REJECTED'
    reviewed_by BIGINT REFERENCES officers(officer_id),
    reviewed_at TIMESTAMP,
    final_label BOOLEAN,                   -- Label ya mwisho iliyowekwa na Officer (FALSE=Salama, TRUE=Fraud)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_transaction
        FOREIGN KEY (transaction_id)
        REFERENCES transactions(transaction_id)
        ON DELETE CASCADE
);
