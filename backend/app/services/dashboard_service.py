from fastapi import HTTPException
from backend.app.database.connection import get_connection


def dashboard_summary():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM transactions")
        total_transactions = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM fraud_predictions WHERE prediction = TRUE")
        predicted_frauds = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM fraud_review_queue WHERE status='PENDING'")
        pending_reviews = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM fraud_review_queue WHERE status='REJECTED'")
        confirmed_frauds = cursor.fetchone()[0]

        fraud_rate = (confirmed_frauds / total_transactions *
                      100) if total_transactions > 0 else 0
        return {
            "total_transactions": total_transactions,
            "predicted_frauds": predicted_frauds,
            "pending_reviews": pending_reviews,
            "confirmed_frauds": confirmed_frauds,
            "fraud_rate": round(fraud_rate, 4)
        }
    finally:
        cursor.close()
        conn.close()


def get_advanced_analytics(timeframe: str = "7days", custom_start: str = None, custom_end: str = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        where_clause = "WHERE 1=1"
        params = []
        if custom_start and custom_end:
            where_clause += " AND t.created_at BETWEEN %s AND %s"
            params.extend([custom_start, custom_end])
        else:
            if timeframe == "24hrs":
                where_clause += " AND t.created_at >= NOW() - INTERVAL '24 hours'"
            elif timeframe == "4weeks":
                where_clause += " AND t.created_at >= NOW() - INTERVAL '4 weeks'"
            elif timeframe == "1year":
                where_clause += " AND t.created_at >= NOW() - INTERVAL '1 year'"
            else:
                where_clause += " AND t.created_at >= NOW() - INTERVAL '7 days'"

        # Kutumia LEFT JOIN kupata status sahihi kutoka kwenye queue ya reviews
        cursor.execute(f"""
            SELECT COALESCE(q.status, 'CLEARED') as txn_status, COUNT(*), SUM(t.amount)
            FROM transactions t
            LEFT JOIN fraud_review_queue q ON t.transaction_id = q.transaction_id
            {where_clause}
            GROUP BY txn_status
        """, params)
        distribution = cursor.fetchall()

        trunc_type = 'hour' if timeframe == "24hrs" else 'day' if timeframe in [
            "7days", "4weeks"] else 'month'

        cursor.execute(f"""
            SELECT DATE_TRUNC('{trunc_type}', t.created_at) as period, COUNT(*)
            FROM transactions t
            INNER JOIN fraud_review_queue q ON t.transaction_id = q.transaction_id
            {where_clause} AND q.status = 'REJECTED'
            GROUP BY period ORDER BY period
        """, params)
        trends = cursor.fetchall()

        cursor.execute(f"""
            SELECT DATE_TRUNC('{trunc_type}', t.created_at) as period, COUNT(*) as vol, SUM(t.amount) as amt
            FROM transactions t
            {where_clause}
            GROUP BY period ORDER BY period
        """, params)
        volume_analytics = cursor.fetchall()

        return {
            "distribution": [{"status": r[0], "count": r[1], "amount": r[2]} for r in distribution],
            "trends": [{"period": str(r[0]), "count": r[1]} for r in trends],
            "volume_analytics": [{"period": str(r[0]), "volume": r[1], "amount": r[2]} for r in volume_analytics]
        }
    finally:
        cursor.close()
        conn.close()


def get_volume_comparison():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_vol,
                COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE), 0) as today_amt,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE) as yesterday_vol,
                COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE), 0) as yesterday_amt
            FROM transactions;
        """)
        r = cursor.fetchone()
        insight = "Volume ipo imara."
        if r[2] > 0 and r[0] < r[2] and r[1] > r[3]:
            insight = f"Tahadhari: Leo kuna miamala michache ({r[0]}) lakini yenye thamani kubwa zaidi (Tsh {r[1]:,.2f}) kuliko jana ({r[2]} miamala ya Tsh {r[3]:,.2f}). Hii inaashiria uwezekano mkubwa wa miamala ya kitapeli ya viwango vya juu (High-Value Fraud Burst)."
        return {
            "today_volume": r[0], "today_amount": r[1],
            "yesterday_volume": r[2], "yesterday_amount": r[3],
            "agent_explanation": insight
        }
    finally:
        cursor.close()
        conn.close()


def recent_predictions():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT prediction_id, transaction_id, fraud_probability, prediction, created_at
            FROM fraud_predictions
            ORDER BY created_at DESC
            LIMIT 100
        """)
        rows = cursor.fetchall()
        return [
            {
                "prediction_id": r[0],
                "transaction_id": r[1],
                "probability": float(r[2]),
                "prediction": r[3],
                "created_at": str(r[4])
            }
            for r in rows
        ]
    finally:
        cursor.close()
        conn.close()


def pending_reviews():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT review_id, transaction_id, fraud_probability, status
            FROM fraud_review_queue
            WHERE status='PENDING'
            ORDER BY fraud_probability DESC
        """)
        rows = cursor.fetchall()
        return [
            {
                "review_id": r[0],
                "transaction_id": r[1],
                "fraud_probability": float(r[2]),
                "status": r[3]
            }
            for r in rows
        ]
    finally:
        cursor.close()
        conn.close()


def fraud_trend():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT reviewed_at::DATE AS day, COUNT(*) AS frauds
            FROM fraud_review_queue
            WHERE final_label = TRUE
            GROUP BY reviewed_at::DATE
            ORDER BY day;
        """)
        rows = cursor.fetchall()
        return [{"date": str(r[0]), "frauds": r[1]} for r in rows]
    finally:
        cursor.close()
        conn.close()


def officer_stats():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT reviewed_by, COUNT(*) reviews
            FROM fraud_review_queue
            WHERE reviewed_by IS NOT NULL
            GROUP BY reviewed_by
            ORDER BY reviews DESC
        """)
        rows = cursor.fetchall()
        return [{"officer": r[0], "reviews": r[1]} for r in rows]
    finally:
        cursor.close()
        conn.close()


def get_pending_reviews():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT q.review_id, q.transaction_id, q.fraud_probability, q.status,
                   t.amount, t.nameOrig, t.nameDest, t.type
            FROM fraud_review_queue q
            JOIN transactions t ON q.transaction_id = t.transaction_id
            WHERE q.status='PENDING'
        """)
        rows = cursor.fetchall()
        columns = ["review_id", "transaction_id", "fraud_probability", "status",
                   "amount", "nameOrig", "nameDest", "type"]
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
            raise HTTPException(status_code=404, detail="Review not found")

        # Rekebisha: Hatugusi jedwali la `transactions` kwani halina `status` au `final_label`
        cursor.execute("""
            UPDATE fraud_review_queue
            SET status='APPROVED', final_label=FALSE, reviewed_by=%s, reviewed_at=CURRENT_TIMESTAMP
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
        cursor.execute(
            "SELECT transaction_id FROM fraud_review_queue WHERE review_id = %s FOR UPDATE", (review_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Review not found")

        # Rekebisha: Hatugusi jedwali la `transactions` kwani halina `status` au `final_label`
        cursor.execute("""
            UPDATE fraud_review_queue
            SET status='REJECTED', final_label=TRUE, reviewed_by=%s, reviewed_at=CURRENT_TIMESTAMP
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
