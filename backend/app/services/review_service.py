from backend.app.database.connection import get_connection

conn = get_connection()
cursor = conn.cursor()

def get_pending_reviews():


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

    conn.close()

    return rows

def approve_review(review_id: int, officer_name: str):
    
    cursor.execute(
        """
    UPDATE fraud_review_queue
    SET
        status='APPROVED',
        final_label=1,
        review_at=GETDATE()
    WHERE review_id=?
    """,
        review_id
    )

    conn.commit()

    return {"message": "approved"}

def reject_review(review_id: int):
    
    cursor.execute(
        """
        UPDATE fraud_review_queue
        SET
            status='REJECTED',
            final_label=0,
            reviewed_at=GETDATE()
        WHERE review_id=?
        """,
        review_id
    )

    conn.commit()

    return {"message": "rejected"}





