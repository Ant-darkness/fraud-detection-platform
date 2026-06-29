from backend.app.database.connection import get_connection

def get_pending_reviews():
    
    conn = get_connection()
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                review_id,
                transaction_id,
                fraud_probability,
                status
            FROM fraud_review_queue
            WHERE status='PENDING'
        """)

        rows = cursor.fetchall()
        columns = [
            "review_id",
            "transaction_id",
            "fraud_probability",
            "status"
        ]
        return [
            dict(zip(columns, row))
            for row in rows
        ]
    
    finally:
        cursor.close()
        conn.close()

    

def approve_review(review_id: int, officer_name: str):
    conn = get_connection()
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
        UPDATE fraud_review_queue
        SET
            status='APPROVED',
            final_label=TRUE,
            reviewed_by=%s,
            reviewed_at=CURRENT_TIMESTAMP
        WHERE review_id=%s
        """,
            (
                officer_name,
                review_id
             )
        )

        conn.commit()
        return {"message": "approved"}
    finally:
        cursor.close()
        conn.close()

    

def reject_review(review_id: int, officer_name: str):
    conn = get_connection()
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE fraud_review_queue
            SET
                status='REJECTED',
                final_label=FALSE,
                reviewed_by=%s,
                reviewed_at=CURRENT_TIMESTAMP
            WHERE review_id=%s
            """,
            (
                officer_name,
                review_id
             )
        )

        conn.commit()
        return {"message": "rejected"}
    finally:
        cursor.close()
        conn.close()
def add_to_review_queue(transaction_id: int, fraud_probability: float):
    
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO fraud_review_queue(
                transaction_id,
                fraud_probability)
                
                VALUES(%s, %s)""",
                (transaction_id,fraud_probability)
        )
        
        conn.commit()
        
    finally:
        cursor.close()
        conn.close()
    





