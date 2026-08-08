-- ============================================================
-- 1. MEZA MAMA ZA DARAJA LA KWANZA (PARENTS WITH NO DEPENDENCIES)
-- ============================================================

-- ------------------------------------------------------------
-- 1.1 OFFICERS TABLE (Inahifadhi taarifa za maofisa wa mfumo)
-- ------------------------------------------------------------
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

    -- CONSTRAINTS:
    -- fk_created_by: Inahusisha ofisa na aliyemtengeneza; akafutwa anakuwa NULL kuzuia error.
    CONSTRAINT fk_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES officers(officer_id) 
        ON DELETE SET NULL,
    -- chk_officer_role: Inahakikisha jukumu la ofisa linatoka kwenye orodha hii pekee.
    CONSTRAINT chk_officer_role 
        CHECK (role IN ('ADMIN', 'FRAUD_ANALYST', 'SUPERVISOR', 'AUDITOR'))
);

-- INDEXES:
-- Kasi wakati wa Login (kwa kutumia username au email) na kuchuja maofisa kwa meza/jukumu.
CREATE INDEX idx_officers_username ON officers(username);
CREATE INDEX idx_officers_email ON officers(email);
CREATE INDEX idx_officers_role ON officers(role);


-- ------------------------------------------------------------
-- 1.2 TRANSACTIONS TABLE (Inahifadhi miamala yote)
-- ------------------------------------------------------------
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- CONSTRAINTS:
    -- Inazuia kuweka kiasi au mizani ya akaunti iliyo chini ya sifuri (hasi).
    CONSTRAINT chk_transaction_amount 
        CHECK (amount >= 0),
    CONSTRAINT chk_balances_non_negative 
        CHECK (oldbalanceOrg >= 0 AND newbalanceOrig >= 0 AND oldbalanceDest >= 0 AND newbalanceDest >= 0)
);

-- INDEXES:
-- Huongeza kasi ya search wakati wa kuchuja miamala kwa aina, watumiaji, au tarehe.
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_nameorig ON transactions(nameOrig);
CREATE INDEX idx_transactions_namedest ON transactions(nameDest);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);


-- ------------------------------------------------------------
-- 1.3 TRAINING_RUNS TABLE (Inafuatilia utengenezaji wa Model)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS training_runs CASCADE;
CREATE TABLE training_runs (
    run_id BIGSERIAL PRIMARY KEY,
    model_version INTEGER,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP,
    status VARCHAR(20),
    message TEXT,

    -- CONSTRAINTS:
    -- Inahakikisha status ya mafunzo ni moja kati ya hatua zilizokubalika.
    CONSTRAINT chk_training_status 
        CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED'))
);

-- INDEXES:
-- Kasi ya kuangalia mafunzo yanayoendelea au kutafuta mafunzo ya toleo fulani la model.
CREATE INDEX idx_training_runs_status ON training_runs(status);
CREATE INDEX idx_training_runs_version ON training_runs(model_version);


-- ============================================================
-- 2. MEZA ZA DARAJA LA PILI (DEPEND ON LEVEL 1 TABLES)
-- ============================================================

-- ------------------------------------------------------------
-- 2.1 PASSWORD_RESET_TOKENS TABLE (Inategemea Officers)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
CREATE TABLE password_reset_tokens (
    token_id BIGSERIAL PRIMARY KEY,
    officer_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- CONSTRAINTS:
    -- fk_token_officer: Inaunga na ofisa; akafutwa, token zake zote zinafutwa kiotomatiki.
    CONSTRAINT fk_token_officer
        FOREIGN KEY (officer_id)
        REFERENCES officers(officer_id)
        ON DELETE CASCADE
);

-- INDEXES:
-- Kasi ya kulinganisha token wakati ofisa anaomba kubadilisha nenosiri.
CREATE INDEX idx_reset_token ON password_reset_tokens(token_hash);


-- ------------------------------------------------------------
-- 2.2 MODEL_REGISTRY TABLE (Inategemea Officers)
-- ------------------------------------------------------------
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

    -- CONSTRAINTS:
    -- fk_model_activated_by: Inahusisha model na ofisa aliye-inua/kui-amsha.
    CONSTRAINT fk_model_activated_by 
        FOREIGN KEY (activated_by) 
        REFERENCES officers(officer_id),
    -- chk_activation_status & dataset_size: Inahakikisha status sahihi na ukubwa wa dataset ni chanya.
    CONSTRAINT chk_activation_status 
        CHECK (activation_status IN ('PENDING', 'ACTIVE', 'DEACTIVATED', 'ARCHIVED')),
    CONSTRAINT chk_dataset_size 
        CHECK (dataset_size IS NULL OR dataset_size > 0)
);

-- INDEXES:
-- Kasi ya kupata model inayofanya kazi hivi sasa (active) na kuchuja kwa status.
CREATE INDEX idx_model_active ON model_registry(is_active);
CREATE INDEX idx_model_status ON model_registry(activation_status);


-- ------------------------------------------------------------
-- 2.3 FRAUD_PREDICTIONS TABLE (Inategemea Transactions)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS fraud_predictions CASCADE;
CREATE TABLE fraud_predictions (
    prediction_id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    fraud_probability DOUBLE PRECISION NOT NULL,
    prediction BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- CONSTRAINTS:
    -- fk_prediction_transaction: Inahusisha utabiri na muamala; muamala ukifutwa na utabiri unafutika.
    CONSTRAINT fk_prediction_transaction 
        FOREIGN KEY (transaction_id) 
        REFERENCES transactions(transaction_id) 
        ON DELETE CASCADE,
    -- chk_fraud_probability_range: Inahakikisha asilimia ya utabiri ipo kati ya 0.0 na 1.0 (0% - 100%).
    CONSTRAINT chk_fraud_probability_range 
        CHECK (fraud_probability BETWEEN 0.0 AND 1.0)
);

-- INDEXES:
-- Kasi ya kupata miamala yenye nafasi kubwa ya kuwa ya udanganyifu (fraud).
CREATE INDEX idx_predictions_probability ON fraud_predictions(fraud_probability);
CREATE INDEX idx_predictions_is_fraud ON fraud_predictions(prediction);


-- ------------------------------------------------------------
-- 2.4 FRAUD_REVIEW_QUEUE TABLE (Inategemea Transactions & Officers)
-- ------------------------------------------------------------
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

    -- CONSTRAINTS:
    -- FKs: Zinaunganisha foleni ya ukaguzi na muamala pamoja na ofisa anayekagua.
    CONSTRAINT fk_review_transaction 
        FOREIGN KEY (transaction_id) 
        REFERENCES transactions(transaction_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_reviewed_by 
        FOREIGN KEY (reviewed_by) 
        REFERENCES officers(officer_id),
    -- CHECKS: Inazuia status zisizoeleweka na inalinda kipimo cha probability kianzie 0.0 hadi 1.0.
    CONSTRAINT chk_review_status 
        CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_review_probability 
        CHECK (fraud_probability BETWEEN 0.0 AND 1.0)
);

-- INDEXES:
-- Kasi ya maofisa kuona foleni ya miamala inayowasubiri (PENDING) au iliyokaguliwa na mtu fulani.
CREATE INDEX idx_review_queue_status ON fraud_review_queue(status);
CREATE INDEX idx_review_queue_reviewed_by ON fraud_review_queue(reviewed_by);


-- ============================================================
-- 3. MEZA ZA DARAJA LA TATU (DEPEND ON LEVEL 2 TABLES)
-- ============================================================

-- ------------------------------------------------------------
-- 3.1 METRIC_REGISTRY TABLE (Inategemea Model Registry)
-- ------------------------------------------------------------
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

    -- CONSTRAINTS:
    -- fk_metric_model: Inahusisha vipimo na model husika; model ikifutwa na vipimo vyake vinafutika.
    CONSTRAINT fk_metric_model 
        FOREIGN KEY (model_id) 
        REFERENCES model_registry(model_id) 
        ON DELETE CASCADE,
    -- CHECKS: Inahakikisha viwango vya utendaji vya model (metrics) vipo kati ya 0.0 na 1.0.
    CONSTRAINT chk_precision_range CHECK (precision_score IS NULL OR precision_score BETWEEN 0.0 AND 1.0),
    CONSTRAINT chk_recall_range CHECK (recall_score IS NULL OR recall_score BETWEEN 0.0 AND 1.0),
    CONSTRAINT chk_f1_range CHECK (f1_score IS NULL OR f1_score BETWEEN 0.0 AND 1.0),
    CONSTRAINT chk_roc_auc_range CHECK (roc_auc IS NULL OR roc_auc BETWEEN 0.0 AND 1.0)
);

-- INDEXES:
-- Kasi ya kuvuta na kulinganisha vipimo (performance metrics) vya model kulingana na ID yake.
CREATE INDEX idx_metric_model_id ON metric_registry(model_id);
