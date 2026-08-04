from datetime import datetime
import json
from fastapi import WebSocket
from backend.app.database.connection import get_connection

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_text(json.dumps(message))

manager = ConnectionManager()

# -------------------------------------------------------------------
# 1. SUMMARY STATS (KPIs)
# -------------------------------------------------------------------
def dashboard_summary():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                COUNT(t.transaction_id) as total_transactions,
                COUNT(CASE WHEN f.final_label = TRUE THEN 1 END) as predicted_frauds,
                COUNT(CASE WHEN f.status = 'PENDING' AND f.final_label = TRUE THEN 1 END) as pending_reviews,
                COUNT(CASE WHEN f.status = 'ISFRAUD' THEN 1 END) as confirmed_frauds
            FROM transactions t
            LEFT JOIN fraud_review_queue f
            ON t.transaction_id = f.transaction_id
        """)
        row = cursor.fetchone()
        
        total = row[0] or 0
        predicted = row[1] or 0
        pending = row[2] or 0
        confirmed = row[3] or 0
        fraud_rate = round((predicted / total * 100), 2) if total > 0 else 0.0

        return {
            "total_transactions": total,
            "predicted_frauds": predicted,
            "pending_reviews": pending,
            "confirmed_frauds": confirmed,
            "fraud_rate": fraud_rate
        }
    finally:
        cursor.close()
        conn.close()

# -------------------------------------------------------------------
# 2. FRAUD VS NON-FRAUD TREND (Kwa ajili ya Dashboard.jsx - Green/Red Bar)
# -------------------------------------------------------------------
def get_dashboard_analytics(timeframe: str = "24hrs", start_date: str = None, end_date: str = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        if start_date and end_date:
            where_clause = f"WHERE t.created_at BETWEEN '{start_date}' AND '{end_date}'"
            trunc_type = 'day'
        elif timeframe == "7days":
            where_clause = "WHERE t.created_at >= CURRENT_DATE - INTERVAL '6 days'"
            trunc_type = 'day'
        elif timeframe == "4weeks":
            where_clause = "WHERE t.created_at >= CURRENT_DATE - INTERVAL '4 weeks'"
            trunc_type = 'day'
        elif timeframe == "1year":
            where_clause = "WHERE t.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'"
            trunc_type = 'month'
        else: # 24hrs default
            where_clause = "WHERE t.created_at >= CURRENT_DATE"
            trunc_type = 'hour'

        #query = f"""
        #    SELECT 
        #        DATE_TRUNC('{trunc_type}', f.created_at) as period,
        #        COUNT(CASE WHEN f.final_label = FALSE THEN 1 END) as non_fraud_count,
        #        COUNT(CASE WHEN f.final_label = TRUE THEN 1 END) as fraud_count
        #    FROM fraud_review_queue f
        #    LEFT JOIN fraud_predictions p
        #    ON f.transacton_id == p.transaction_id
        #    {where_clause}
        #    GROUP BY period ORDER BY period
        #"""
        
        query = f"""
            WITH 
            -- 1. Kuhesabu fraud na non-fraud kulingana na muda wa review queue
            review_counts AS (
                SELECT 
                    DATE_TRUNC('{trunc_type}', created_at) AS period,
                    COUNT(CASE WHEN final_label = FALSE THEN 1 END) AS non_fraud_count,
                    COUNT(CASE WHEN final_label = TRUE THEN 1 END) AS fraud_count
                FROM fraud_review_queue
                {where_clause}
                GROUP BY period
            ),

            -- 2. Kuhesabu non-fraud predictions kulingana na muda wa predictions wenyewe
            prediction_counts AS (
                SELECT 
                    DATE_TRUNC('{trunc_type}', created_at) AS period, -- au tumia prediction_time/timestamp ya table hii
                    COUNT(*) AS predicted_non_fraud_count
                FROM fraud_predictions
                {where_clause}
                GROUP BY period
            )

            -- 3. Unganisha zote mbili kwa kutumia period (FULL JOIN ili kuruhusu vipindi ambavyo vinaweza kuwa na predictions lakini havipo kwenye review queue, au vice versa)
            SELECT 
                COALESCE(r.period, p.period) AS period,
                COALESCE(r.non_fraud_count, 0) AS non_fraud_count,
                COALESCE(r.fraud_count, 0) AS fraud_count,
                COALESCE(p.predicted_non_fraud_count, 0) AS predicted_non_fraud_count
            FROM review_counts r
            FULL OUTER JOIN prediction_counts p 
                ON r.period = p.period
            ORDER BY period;
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        trend = []
        for r in rows:
            dt_obj = r[0]
            if timeframe == "24hrs":
                label = dt_obj.strftime("%H:%M") if isinstance(dt_obj, datetime) else str(dt_obj)
            elif timeframe == "1year":
                label = dt_obj.strftime("%b %Y") if isinstance(dt_obj, datetime) else str(dt_obj)
            else:
                label = dt_obj.strftime("%d %b") if isinstance(dt_obj, datetime) else str(dt_obj)

            trend.append({
                "time_label": label,
                "non_fraud_count": r[1] or 0,
                "fraud_count": r[2] or 0
            })

        return {"trend": trend}
    finally:
        cursor.close()
        conn.close()

# -------------------------------------------------------------------
# 3. VOLUME COMPARISON (Kwa ajili ya VolumeAnalysis.jsx - Volume/Amount)
# -------------------------------------------------------------------
def get_volume_comparison_data(timeframe: str = "24hrs", start_date: str = None, end_date: str = None):
    conn = get_connection()
    try:
        cursor = conn.cursor()

        if start_date and end_date:
            where_clause = f"WHERE t.created_at BETWEEN '{start_date}' AND '{end_date}'"
            trunc_type = 'day'
        elif timeframe == "7days":
            where_clause = "WHERE t.created_at >= CURRENT_DATE - INTERVAL '6 days'"
            trunc_type = 'day'
        elif timeframe == "4weeks":
            where_clause = "WHERE t.created_at >= CURRENT_DATE - INTERVAL '4 weeks'"
            trunc_type = 'day'
        elif timeframe == "1year":
            where_clause = "WHERE t.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'"
            trunc_type = 'month'
        else:
            where_clause = "WHERE t.created_at >= CURRENT_DATE"
            trunc_type = 'hour'

        cursor.execute(f"""
            SELECT 
                DATE_TRUNC('{trunc_type}', t.created_at) as period, 
                COUNT(*) as volume, 
                COALESCE(SUM(t.amount), 0) as amount
            FROM transactions t
            {where_clause}
            GROUP BY period ORDER BY period
        """)
        rows = cursor.fetchall()

        chart_data = []
        total_vol = 0
        total_amt = 0.0

        for r in rows:
            dt_obj = r[0]
            if timeframe == "24hrs":
                label = dt_obj.strftime("%H:%M") if isinstance(dt_obj, datetime) else str(dt_obj)
            elif timeframe == "1year":
                label = dt_obj.strftime("%b %Y") if isinstance(dt_obj, datetime) else str(dt_obj)
            else:
                label = dt_obj.strftime("%d %b") if isinstance(dt_obj, datetime) else str(dt_obj)

            vol = r[1] or 0
            amt = float(r[2] or 0)

            total_vol += vol
            total_amt += amt

            chart_data.append({
                "time_label": label,
                "volume": vol,
                "amount": amt
            })

        return {
            "total_volume": total_vol,
            "total_amount": total_amt,
            "chart_data": chart_data
        }
    finally:
        cursor.close()
        conn.close()

# -------------------------------------------------------------------
# 4. PLOTLY WEBSOCKET LIVE ENGINE (Isiyoharibiwa)
# -------------------------------------------------------------------
def generate_plotly_volume_chart(timeframe: str = "24hrs"):
    res = get_volume_comparison_data(timeframe=timeframe)
    x_labels = [item["time_label"] for item in res["chart_data"]]
    y_volumes = [item["volume"] for item in res["chart_data"]]
    hover_amounts = [item["amount"] for item in res["chart_data"]]

    plotly_data = {
        "type": "plotly_chart_update",
        "timeframe": timeframe,
        "plotly_spec": {
            "data": [
                {
                    "x": x_labels,
                    "y": y_volumes,
                    "type": "bar",
                    "name": "Transaction Volume",
                    "text": hover_amounts,
                    "hovertemplate": "<b>Muda:</b> %{x}<br><b>Volume:</b> %{y}<br><b>Jumla (TZS):</b> %{text:,.2f}<extra></extra>",
                    "marker": {"color": "#3B82F6"}
                }
            ],
            "layout": {
                "title": f"Real-Time Transactions Trend ({timeframe})",
                "xaxis": {"title": "Muda / Tarehe", "type": "category"},
                "yaxis": {"title": "Idadi ya Miamala (Volume)"},
                "autosize": True,
                "margin": {"l": 40, "r": 40, "t": 40, "b": 40}
            }
        }
    }
    return plotly_data
