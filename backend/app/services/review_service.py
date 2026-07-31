from fastapi import HTTPException
from backend.app.database.connection import get_connection


def get_pending_reviews(page: int = 1, limit: int = 10):
    conn = get_connection()
    try:
        cursor = conn.cursor()

        # 1. Pata jumla ya miamala yote inayosubiri ukaguzi (PENDING)
        cursor.execute(
            "SELECT COUNT(*) FROM fraud_review_queue WHERE status='PENDING'")
        total_count = cursor.fetchone()[0]

        # 2. Kakula offset kulingana na page na limit
        offset = (page - 1) * limit

        # 3. Chukua data za ukurasa husika pekee
        cursor.execute("""
            SELECT q.review_id, q.transaction_id, q.fraud_probability, q.status,
                   t.amount, t.nameOrig, t.nameDest, t.type, t.step,
                   t.oldbalanceOrg, t.newbalanceOrig, t.oldbalanceDest, t.newbalanceDest
            FROM fraud_review_queue q
            JOIN transactions t ON q.transaction_id = t.transaction_id
            WHERE q.status='PENDING'
            ORDER BY q.review_id DESC
            LIMIT %s OFFSET %s
        """, (limit, offset))

        rows = cursor.fetchall()

        columns = [
            "review_id", "transaction_id", "fraud_probability", "status",
            "amount", "nameOrig", "nameDest", "type", "step",
            "oldbalanceOrg", "newbalanceOrig", "oldbalanceDest", "newbalanceDest"
        ]

        reviews = [dict(zip(columns, row)) for row in rows]

        return {
            "items": reviews,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 1
        }
    finally:
        cursor.close()
        conn.close()



def approve_review(review_id: int, officer_id: int):
    conn = get_connection()
    try:
        conn.autocommit = False
        cursor = conn.cursor()
        cursor.execute("SELECT transaction_id FROM fraud_review_queue WHERE review_id = %s FOR UPDATE", (review_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Review not found")
        transaction_id = row[0]
        #cursor.execute("UPDATE transactions SET status = 'APPROVED', final_label = FALSE WHERE transaction_id = %s", (transaction_id,))
        cursor.execute("""
            UPDATE fraud_review_queue
            SET status='NOTFRAUD', final_label=FALSE, reviewed_by=%s, reviewed_at=CURRENT_TIMESTAMP
            WHERE review_id=%s
        """, (officer_id, review_id))
        conn.commit()
        return {"status": "success", "message": "Transaction cleared and approved"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

def reject_review(review_id: int, officer_id: int):
    conn = get_connection()
    try:
        conn.autocommit = False
        cursor = conn.cursor()
        cursor.execute("SELECT transaction_id FROM fraud_review_queue WHERE review_id = %s FOR UPDATE", (review_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Review not found")
        transaction_id = row[0]
        #cursor.execute("UPDATE transactions SET status = 'REJECTED', final_label = TRUE WHERE transaction_id = %s", (transaction_id,))
        cursor.execute("""
            UPDATE fraud_review_queue
            SET status='ISFRAUD', final_label=TRUE, reviewed_by=%s, reviewed_at=CURRENT_TIMESTAMP
            WHERE review_id=%s
        """, (officer_id, review_id))
        conn.commit()
        return {"status": "success", "message": "Transaction confirmed as fraud and blocked"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()
