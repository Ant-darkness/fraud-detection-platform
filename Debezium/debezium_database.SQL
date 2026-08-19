-- ==========================================
-- HATUA YA 1: SANAFISHA DATABASE & WAL LEVEL
-- ==========================================
-- Hakikisha wal_level ipo 'logical' (Hii inafanyika mara moja kwenye postgresql.conf)

SHOW wal_level;

-- ==========================================
-- HATUA YA 2: TENGENEZA SCHEMA NA TABLE
-- ==========================================
DROP TABLE IF EXISTS public.transactions CASCADE;

CREATE TABLE public.transactions (
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

    -- CONSTRAINTS
    CONSTRAINT chk_transaction_amount 
        CHECK (amount >= 0),
    CONSTRAINT chk_balances_non_negative 
        CHECK (oldbalanceOrg >= 0 AND newbalanceOrig >= 0 AND oldbalanceDest >= 0 AND newbalanceDest >= 0)
);

-- INDEXES (Za kuongeza kasi ya search)
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_nameorig ON public.transactions(nameOrig);
CREATE INDEX idx_transactions_namedest ON public.transactions(nameDest);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);

-- ==========================================
-- HATUA YA 3: WEKA REPLICA IDENTITY (MUHIMU SANA)
-- ==========================================
-- Hii inalazimu Postgres kuhifadhi taarifa zote za zamani na mpya kwenye WAL log wakati wa UPDATE/DELETE
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- ==========================================
-- HATUA YA 4: SAJILI TABLE KWENYE PUBLICATION
-- ==========================================
-- Futa publication ya zamani kama ipo kisha tengeneza mpya
DROP PUBLICATION IF EXISTS local_bot_fraud_publication CASCADE;

CREATE PUBLICATION local_bot_fraud_publication FOR TABLE public.transactions;

-- ==========================================
-- HATUA YA 5: KAGUA SHUGHULI NA REPLICATION
-- ==========================================
-- 1. Hakikisha publication imetengenezwa na ina table yako
SELECT * FROM pg_publication;
SELECT * FROM pg_publication_tables WHERE pubname = 'local_bot_fraud_publication';

-- 2. Kagua replication slots (Debezium itaitengeneza yenyewe connector ikianza)
SELECT slot_name, plugin, active FROM pg_replication_slots;
