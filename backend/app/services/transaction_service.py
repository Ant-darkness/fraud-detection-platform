from backend.app.database.connection import get_connection

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
        return transaction_id
    finally:
        cursor.close()
        conn.close()

def get_transaction(transaction_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE transaction_id=%s", (transaction_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

def get_transactions():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions ORDER BY created_at DESC")
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
