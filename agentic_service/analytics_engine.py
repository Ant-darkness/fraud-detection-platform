import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "fraud-postgres"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "FraudDB"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "Fraud@2026")
    )

def parse_timeframe(timeframe: str) -> str:
    mapping = {
        "24HRS": "24 HOURS",
        "7DAYS": "7 DAYS",
        "4WEEKS": "28 DAYS",
        "1YEAR": "365 DAYS"
    }
    return mapping.get(timeframe.upper(), "7 DAYS")

def fetch_volume_data(timeframe: str) -> dict:
    interval = parse_timeframe(timeframe)
    query = f"""
        SELECT 
            COUNT(transaction_id) AS total_transactions,
            COALESCE(SUM(amount), 0.0) AS total_volume_tzs,
            COALESCE(AVG(amount), 0.0) AS avg_transaction_amount,
            COALESCE(MAX(amount), 0.0) AS max_transaction_amount,
            COALESCE(MIN(amount), 0.0) AS min_transaction_amount
        FROM transactions
        WHERE created_at >= NOW() - INTERVAL '{interval}';
    """
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query)
            return dict(cur.fetchone() or {})

def fetch_fraud_data(timeframe: str) -> dict:
    interval = parse_timeframe(timeframe)
    query = f"""
        WITH timeframe_tx AS (
            SELECT transaction_id 
            FROM transactions 
            WHERE created_at >= NOW() - INTERVAL '{interval}'
        ),
        predictions_summary AS (
            SELECT 
                COUNT(CASE WHEN fp.prediction = FALSE THEN 1 END) AS predicted_safe_count
            FROM fraud_predictions fp
            JOIN timeframe_tx t ON fp.transaction_id = t.transaction_id
        ),
        queue_summary AS (
            SELECT 
                COUNT(CASE WHEN frq.final_label = TRUE OR frq.status = 'ISFRAUD' THEN 1 END) AS confirmed_fraud_count,
                COUNT(CASE WHEN frq.final_label = FALSE OR frq.status = 'NOTFRAUD' THEN 1 END) AS confirmed_safe_queue_count,
                COUNT(CASE WHEN frq.status IN ('PENDING', 'UNDER_REVIEW') THEN 1 END) AS pending_review_count,
                COALESCE(AVG(frq.fraud_probability), 0.0) AS avg_flagged_risk_score
            FROM fraud_review_queue frq
            JOIN timeframe_tx t ON frq.transaction_id = t.transaction_id
        )
        SELECT 
            (SELECT COUNT(*) FROM timeframe_tx) AS total_evaluated_transactions,
            COALESCE((SELECT predicted_safe_count FROM predictions_summary), 0) + 
            COALESCE((SELECT confirmed_safe_queue_count FROM queue_summary), 0) AS total_safe_transactions,
            COALESCE((SELECT confirmed_fraud_count FROM queue_summary), 0) AS total_confirmed_fraud,
            COALESCE((SELECT pending_review_count FROM queue_summary), 0) AS total_pending_review,
            COALESCE((SELECT avg_flagged_risk_score FROM queue_summary), 0.0) AS avg_flagged_risk_score;
    """
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query)
            return dict(cur.fetchone() or {})
