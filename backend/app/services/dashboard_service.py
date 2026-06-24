from backend.app.database.connection import get_connection


conn = get_connection()
cursor = conn.cursor()

def dashboard_summary():

    cursor.execute("""
        SELECT COUNT(*)
        FROM transactions
    """)
    total_transactions = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*)
        FROM fraud_predictions
        WHERE prediction = 1
    """)
    predicted_frauds = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*)
        FROM fraud_review_queue
        WHERE status='PENDING'
    """)
    pending_reviews = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(*)
        FROM fraud_review_queue
        WHERE final_label=1
    """)
    confirmed_frauds = cursor.fetchone()[0]

    fraud_rate = 0

    if total_transactions > 0:
        fraud_rate = (
            confirmed_frauds /
            total_transactions
        ) * 100

    return {
        "total_transactions": total_transactions,
        "predicted_frauds": predicted_frauds,
        "pending_reviews": pending_reviews,
        "confirmed_frauds": confirmed_frauds,
        "fraud_rate": round(fraud_rate, 4)
    }


def recent_predictions():

    cursor.execute("""
        SELECT TOP 100
            prediction_id,
            transaction_id,
            fraud_probability,
            prediction,
            created_at
        FROM fraud_predictions
        ORDER BY created_at DESC
    """)

    rows = cursor.fetchall()

    return [
        {
            "prediction_id": r.prediction_id,
            "transaction_id": r.transaction_id,
            "probability": float(r.fraud_probability),
            "prediction": r.prediction,
            "created_at": str(r.created_at)
        }
        for r in rows
    ]

def pending_reviews():

    cursor.execute("""
        SELECT
            review_id,
            transaction_id,
            fraud_probability,
            status
        FROM fraud_review_queue
        WHERE status='PENDING'
        ORDER BY fraud_probability DESC
    """)

    rows = cursor.fetchall()

    return [
        {
            "review_id": r.review_id,
            "transaction_id": r.transaction_id,
            "fraud_probability": float(r.fraud_probability),
            "status": r.status
        }
        for r in rows
    ]
def fraud_trend():

    cursor.execute("""
        SELECT
            CAST(reviewed_at AS DATE) AS day,
            COUNT(*) AS frauds
        FROM fraud_review_queue
        WHERE final_label = 1
        GROUP BY CAST(reviewed_at AS DATE)
        ORDER BY day
    """)

    rows = cursor.fetchall()

    return [
        {
            "date": str(r.day),
            "frauds": r.frauds
        }
        for r in rows
    ]


def officer_stats():

    cursor.execute("""
        SELECT
            reviewed_by,
            COUNT(*) reviews
        FROM fraud_review_queue
        WHERE reviewed_by IS NOT NULL
        GROUP BY reviewed_by
        ORDER BY reviews DESC
    """)

    rows = cursor.fetchall()

    return [
        {
            "officer": r.reviewed_by,
            "reviews": r.reviews
        }
        for r in rows
    ]
