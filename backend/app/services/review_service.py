from fastapi import HTTPException
from backend.app.database.connection import get_connection


def get_pending_reviews():
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT
                q.review_id,
                q.transaction_id,
                q.fraud_probability,
                q.status,
                t.amount,
                t.nameOrig,
                t.nameDest,
                t.type
            FROM fraud_review_queue q
            JOIN transactions t ON q.transaction_id = t.transaction_id
            WHERE q.status='PENDING'
        """)

        rows = cursor.fetchall()
        columns = [
            "review_id", "transaction_id", "fraud_probability", "status",
            "amount", "nameOrig", "nameDest", "type"
        ]
        return [dict(zip(columns, row)) for row in rows]
    finally:
        cursor.close()
        conn.close()


def approve_review(review_id: int, officer_id: int):

    conn = get_connection()
    try:
        conn.autocommit = False
        cursor = conn.cursor()

        cursor.execute(
            "SELECT transaction_id FROM fraud_review_queue WHERE review_id = %s FOR UPDATE", (review_id,))
        
        
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=404,
                detail="Review not found")
        transaction_id = row[0]

        
        cursor.execute(
            """
            UPDATE transactions 
            SET status = 'APPROVED', final_label = FALSE 
            WHERE transaction_id = %s
            """,
            (transaction_id,)
        )

        cursor.execute(
            """
            UPDATE fraud_review_queue
            SET
                status='APPROVED',
                final_label=FALSE,
                reviewed_by=%s,
                reviewed_at=CURRENT_TIMESTAMP
            WHERE review_id=%s
            """,
            (officer_id, review_id)
        )

        conn.commit()
        
        return {"status": "success", "message": "Transaction cleared and approved successfully"}
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    finally:
        cursor.close()
        conn.close()


def reject_review(review_id: int, officer_id: int):
    """ 
    Afisa amethibitisha muamala ni WA TAPELI (Fraud).
    Muamala unakataliwa kabisa (HELD -> REJECTED, final_label = TRUE)
    """
    conn = get_connection()
    try:
        conn.autocommit = False
        cursor = conn.cursor()

        # 1. Pata transaction_id inayohusika
        cursor.execute(
            "SELECT transaction_id FROM fraud_review_queue WHERE review_id = %s FOR UPDATE", (review_id,))
        
        row = cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=404,
                detail="Review not found")
            
        transaction_id = row[0]

       
        cursor.execute(
            """
            UPDATE transactions 
            SET status = 'REJECTED', final_label = TRUE 
            WHERE transaction_id = %s
            """,
            (transaction_id,)
        )

        cursor.execute(
            """
            UPDATE fraud_review_queue
            SET
                status='REJECTED',
                final_label=TRUE,
                reviewed_by=%s,
                reviewed_at=CURRENT_TIMESTAMP
            WHERE review_id=%s
            """,
            (officer_id, review_id)
        )

        conn.commit()
        return {"status": "success", "message": "Transaction confirmed as fraud and blocked"}
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    finally:
        cursor.close()
        conn.close()
