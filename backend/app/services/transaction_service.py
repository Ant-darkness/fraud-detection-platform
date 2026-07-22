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
        

def get_transactions(page: int = 1, limit: int = 15):
    conn = get_connection()
    try:
        cursor = conn.cursor()

        # 1. Hesabu miamala yote iliyopo kwa ajili ya hesabu ya kurasa za Frontend
        cursor.execute("SELECT COUNT(*) FROM transactions")
        total_count = cursor.fetchone()[0]

        # 2. Kokotoa offset (unapoanzia kusoma miamala)
        offset = (page - 1) * limit

        # 3. MAREKEBISHO: Tumeondoa transaction_id, tukaleta nguzo zote za salio (balance fields)
        cursor.execute("""
            SELECT step, type, amount, oldbalanceorg, newbalanceorig, 
                   oldbalancedest, newbalancedest, created_at
            FROM transactions 
            ORDER BY created_at DESC 
            LIMIT %s OFFSET %s
        """, (limit, offset))

        # Badilisha kuwa orodha ya dictionaries ili kurahisisha usomaji JSON kule FastAPI
        columns = [desc[0] for desc in cursor.description]
        transactions = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return {
            "data": transactions,
            "total": total_count
        }
    finally:
        cursor.close()
        conn.close()
