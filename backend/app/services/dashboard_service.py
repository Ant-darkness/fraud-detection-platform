from .ai_agent import run_policy_ai_agent
import json
from .ai_agent import run_policy_ai_agent  # Hakikisha una-import module yako mpya
from datetime import datetime
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


def get_advanced_analytics(timeframe: str = "7days", start_date: str = None, end_date: str = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        where_clause = "WHERE 1=1"
        params = []

        if start_date and end_date:
            where_clause += " AND t.created_at BETWEEN %s AND %s"
            params.extend([start_date, end_date])
            trunc_type = 'day'
        else:
            if timeframe == "24hrs":
                # Inaanza saa 00:00 usiku wa leo rasmi ya kalenda
                where_clause += " AND t.created_at >= CURRENT_DATE"
                trunc_type = 'hour'
            elif timeframe == "4weeks":
                where_clause += " AND t.created_at >= CURRENT_DATE - INTERVAL '4 weeks'"
                trunc_type = 'day'
            elif timeframe == "1year":
                where_clause += " AND t.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'"
                trunc_type = 'month'
            else:  # 7days
                where_clause += " AND t.created_at >= CURRENT_DATE - INTERVAL '6 days'"
                trunc_type = 'day'

        # Helper function ya kutengeneza label safi ya muda kwa ajili ya Frontend X-Axis
        def format_label(dt_obj):
            if not isinstance(dt_obj, datetime):
                return str(dt_obj)
            if timeframe == "24hrs":
                return dt_obj.strftime("%H:%M")  # Mfano: 04:00
            elif timeframe == "1year":
                return dt_obj.strftime("%b %Y")  # Mfano: Jan 2026
            else:
                return dt_obj.strftime("%d %b")  # Mfano: 17 Jul

        # Query 1: Trend ya miamala yenye shaka/utapeli uliokataliwa (BarChart)
        cursor.execute(f"""
            SELECT DATE_TRUNC('{trunc_type}', t.created_at) as period, COUNT(*)
            FROM transactions t
            INNER JOIN fraud_review_queue q ON t.transaction_id = q.transaction_id
            {where_clause} AND q.status = 'ISFRAUD'
            GROUP BY period ORDER BY period
        """, params)
        trends_raw = cursor.fetchall()

        trend_list = [
            {
                "time_label": format_label(r[0]),
                "count": r[1]
            }
            for r in trends_raw
        ]

        # Query 2: Dynamic Time-Series Distribution (AreaChart)
        cursor.execute(f"""
            SELECT DATE_TRUNC('{trunc_type}', t.created_at) as period, COUNT(*)
            FROM transactions t
            INNER JOIN fraud_review_queue q ON t.transaction_id = q.transaction_id
            {where_clause} AND q.status IN ('PENDING', 'ISFRAUD')
            GROUP BY period ORDER BY period
        """, params)
        distribution_raw = cursor.fetchall()

        dist_list = [
            {
                "time_label": format_label(r[0]),
                "count": r[1]
            }
            for r in distribution_raw
        ]

        return {
            "trend": trend_list,
            "distribution": dist_list
        }

    finally:
        cursor.close()
        conn.close()



def get_volume_comparison(timeframe: str = "7days", custom_start: str = None, custom_end: str = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        where_clause = "WHERE 1=1"
        params = []

        if custom_start and custom_end:
            where_clause += " AND t.created_at BETWEEN %s AND %s"
            params.extend([custom_start, custom_end])
            trunc_type = 'day'
        else:
            if timeframe == "24hrs":
                # Kuanzia saa 00:00 usiku wa leo (Calendar Day boundary)
                where_clause += " AND t.created_at >= CURRENT_DATE"
                trunc_type = 'hour'
            elif timeframe == "7days":
                # Kuanzia Jumatatu ya wiki hii au siku 7 rasmi za kalenda
                where_clause += " AND t.created_at >= CURRENT_DATE - INTERVAL '6 days'"
                trunc_type = 'day'
            elif timeframe == "4weeks":
                # Wiki 4 za kalenda zilizopita
                where_clause += " AND t.created_at >= CURRENT_DATE - INTERVAL '4 weeks'"
                trunc_type = 'day'
            elif timeframe == "1year":
                # Miezi 12 ya kalenda
                where_clause += " AND t.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'"
                trunc_type = 'month'
            else:
                where_clause += " AND t.created_at >= CURRENT_DATE - INTERVAL '6 days'"
                trunc_type = 'day'

        # 1. Kokotoa Jumla Kuu (Total Aggregate Metrics)
        cursor.execute(
            f"SELECT COUNT(*), COALESCE(SUM(t.amount), 0) FROM transactions t {where_clause}", params)
        total_stats = cursor.fetchone()
        total_volume = total_stats[0]
        total_amount = float(total_stats[1])

        # 2. Tengeneza Data ya Grafu kulingana na Vipindi (Intervals) vya Muda
        cursor.execute(f"""
            SELECT DATE_TRUNC('{trunc_type}', t.created_at) as period, 
                   COUNT(*) as vol, 
                   COALESCE(SUM(t.amount), 0) as amt
            FROM transactions t
            {where_clause}
            GROUP BY period ORDER BY period
        """, params)
        series_raw = cursor.fetchall()

        def format_label(dt_obj):
            if not isinstance(dt_obj, datetime):
                return str(dt_obj)
            if timeframe == "24hrs":
                # Saa ya kalenda (Mfano 00:00, 01:00, 02:00)
                return dt_obj.strftime("%H:%M")
            elif timeframe == "1year":
                return dt_obj.strftime("%b %Y")  # Mwezi (Mfano Jan 2026)
            else:
                return dt_obj.strftime("%d %b")  # Siku (Mfano 15 Jul)

        chart_data = [
            {
                "time_label": format_label(r[0]),
                "volume": r[1],
                "amount": float(r[2])
            }
            for r in series_raw
        ]

        # 3. Washa AI Agent na umpe maelekezo ya mienendo ya muda (per hour/day na jumla kuu)
        ai_briefing = run_policy_ai_agent(
            timeframe=timeframe,
            volume=total_volume,
            amount=total_amount,
            chart_data=chart_data
        )

        return {
            "total_volume": total_volume,
            "total_amount": total_amount,
            "chart_data": chart_data,
            "agent_explanation": ai_briefing["explanation"],
            "agent_recommendation": ai_briefing["recommendation"]
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
        cursor.execute(
            "SELECT transaction_id FROM fraud_review_queue WHERE review_id = %s FOR UPDATE", (review_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Review not found")

        # Rekebisha: Hatugusi jedwali la `transactions` kwani halina `status` au `final_label`
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
