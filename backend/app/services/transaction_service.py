import logging
from backend.app.database.connection import get_connection
from backend.app.services.dashboard_service import live_counter

logger = logging.getLogger("transaction_service")


def save_transaction(data: dict):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO transactions(step, type, amount, oldbalanceOrg, newbalanceOrig,
                                     oldbalanceDest, newbalanceDest)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING transaction_id
        """, (
            data["step"], data["type"], data["amount"],
            data["oldbalanceOrg"], data["newbalanceOrig"],
            data["oldbalanceDest"], data["newbalanceDest"]
        ))
        transaction_id = cursor.fetchone()[0]
        conn.commit()

        # 🚀 ONGEZA LIVE COUNTER (In-Memory Atomic Step)
        live_counter.increment(1)

        return transaction_id
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to save transaction: {str(e)}")
        raise e
    finally:
        cursor.close()
        conn.close()


def get_transaction(transaction_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM transactions WHERE transaction_id=%s", (transaction_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()


def get_transactions(page: int = 1, limit: int = 15):
    conn = get_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM transactions")
        total_count = cursor.fetchone()[0]

        offset = (page - 1) * limit

        cursor.execute("""
            SELECT step, type, amount, oldbalanceorg, newbalanceorig, 
                   oldbalancedest, newbalancedest, created_at
            FROM transactions 
            ORDER BY created_at DESC 
            LIMIT %s OFFSET %s
        """, (limit, offset))

        columns = [desc[0] for desc in cursor.description]
        transactions = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return {
            "data": transactions,
            "total": total_count
        }
    finally:
        cursor.close()
        conn.close()
