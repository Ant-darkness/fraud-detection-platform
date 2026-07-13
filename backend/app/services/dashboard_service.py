from datetime import datetime, timedelta
from backend.app.database.connection import get_connection


def get_advanced_analytics(timeframe: str = "7days", custom_start: str = None, custom_end: str = None):
    conn = get_connection()
    cursor = conn.cursor()

    # Base filter building
    where_clause = "WHERE 1=1"
    params = []

    if custom_start and custom_end:
        where_clause += " AND created_at BETWEEN %s AND %s"
        params.extend([custom_start, custom_end])
    else:
        if timeframe == "24hrs":
            where_clause += " AND created_at >= NOW() - INTERVAL '24 hours'"
        elif timeframe == "4weeks":
            where_clause += " AND created_at >= NOW() - INTERVAL '4 weeks'"
        elif timeframe == "1year":
            where_clause += " AND created_at >= NOW() - INTERVAL '1 year'"
        else:  # Default 7days
            where_clause += " AND created_at >= NOW() - INTERVAL '7 days'"

    try:
        # 1. Fraud vs Non-Fraud Distribution
        cursor.execute(f"""
            SELECT status, COUNT(*), SUM(amount) 
            FROM transactions 
            {where_clause} 
            GROUP BY status
        """, params)
        distribution = cursor.fetchall()

        # 2. Fraud Trend Timeline (Grouped by appropriate intervals)
        trunc_type = 'hour' if timeframe == "24hrs" else 'day' if timeframe in [
            "7days", "4weeks"] else 'month'
        cursor.execute(f"""
            SELECT DATE_TRUNC('{trunc_type}', created_at) as period, COUNT(*) 
            FROM transactions 
            {where_clause} AND status = 'REJECTED'
            GROUP BY period ORDER BY period
        """, params)
        trends = cursor.fetchall()

        # 3. Transaction Volume and Amount Analytics
        cursor.execute(f"""
            SELECT DATE_TRUNC('{trunc_type}', created_at) as period, COUNT(*) as vol, SUM(amount) as amt
            FROM transactions
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
    cursor = conn.cursor()
    try:
        # Compare Today vs Yesterday
        cursor.execute("""
            SELECT 
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_vol,
                COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE), 0) as today_amt,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE) as yesterday_vol,
                COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE), 0) as yesterday_amt
            FROM transactions;
        """)
        r = cursor.fetchone()

        # Agent Insights automated logic
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


def dashboard_summary():
    conn = get_connection()
    
    try:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT COUNT(*)
            FROM transactions
        """)
        total_transactions = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*)
            FROM fraud_predictions
            WHERE prediction = TRUE
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
            WHERE final_label=TRUE
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
        
    finally:
        cursor.close()
        conn.close()


def recent_predictions():
    conn = get_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                prediction_id,
                transaction_id,
                fraud_probability,
                prediction,
                created_at
            FROM fraud_predictions
            ORDER BY created_at DESC
            LIMIT 100
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
            for r in rows]
        
    finally:
        cursor.close()
        conn.close()

def pending_reviews():
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
            for r in rows]
    finally:
        cursor.close()
        conn.close()
        
        
        
def fraud_trend():
    conn = get_connection()
    
    try:
        cursor = conn.cursor()

        cursor.execute("""
        SELECT
        reviewed_at::DATE AS day,
        COUNT(*) AS frauds
        FROM fraud_review_queue
        WHERE final_label = TRUE
        GROUP BY reviewed_at::DATE
        ORDER BY day;
        """)

        rows = cursor.fetchall()

        return [
            {
                "date": str(r.day),
                "frauds": r.frauds
            }
            for r in rows
        ]
        
    finally:
        cursor.close()
        conn.close()


def officer_stats():
    conn = get_connection()
    
    try:
        
        cursor = conn.cursor()

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
    finally:
        cursor.close()
        conn.close()
