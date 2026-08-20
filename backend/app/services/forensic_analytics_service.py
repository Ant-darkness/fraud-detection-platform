import logging
from datetime import datetime
from typing import Dict, Any, Optional, Tuple, List
from backend.app.database.connection import get_connection

logger = logging.getLogger("forensic_analytics_service")


def _resolve_time_params(
    timeframe: str, 
    start_date: Optional[str], 
    end_date: Optional[str]
) -> Tuple[str, str, str, str, str, List[Any]]:
    """
    Inaandaa SQL clauses, truncation types, na formatting logic 
    kulingana na timeframe (24HRS, 7DAYS, 4WEEKS, 1YEAR) au Custom Dates.
    """
    tf = timeframe.upper() if timeframe else "24HRS"
    params = []
    
    # 1. Custom Date Filtering (kama mtumiaji amechagua tarehe mahsusi)
    if start_date and end_date:
        where_tx = "WHERE t.created_at BETWEEN %s AND %s"
        where_rev = "WHERE f.created_at BETWEEN %s AND %s"
        params = [start_date, end_date]
        
        if tf == "24HRS":
            group_expr = "DATE_TRUNC('hour', created_at)"
            label_fmt = "%H:%M"
            order_expr = group_expr
        elif tf == "1YEAR":
            group_expr = "DATE_TRUNC('month', created_at)"
            label_fmt = "%b %Y"
            order_expr = group_expr
        elif tf == "4WEEKS":
            group_expr = "DATE_TRUNC('week', created_at)"
            label_fmt = "W%W (%b)"
            order_expr = group_expr
        else: # 7DAYS au default
            group_expr = "DATE_TRUNC('day', created_at)"
            label_fmt = "%d %b"
            order_expr = group_expr

        return where_tx, where_rev, group_expr, label_fmt, order_expr, params

    # 2. Preset Timeframes
    if tf == "7DAYS":
        where_tx = "WHERE t.created_at >= CURRENT_DATE - INTERVAL '6 days'"
        where_rev = "WHERE f.created_at >= CURRENT_DATE - INTERVAL '6 days'"
        group_expr = "DATE_TRUNC('day', created_at)"
        label_fmt = "%d %b"
        order_expr = group_expr

    elif tf == "4WEEKS":
        where_tx = "WHERE t.created_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '3 weeks'"
        where_rev = "WHERE f.created_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '3 weeks'"
        group_expr = "DATE_TRUNC('week', created_at)"
        label_fmt = "Wiki %W"  # Au kuunganisha na mwezi
        order_expr = group_expr

    elif tf == "1YEAR":
        where_tx = "WHERE t.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'"
        where_rev = "WHERE f.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'"
        group_expr = "DATE_TRUNC('month', created_at)"
        label_fmt = "%b %Y"
        order_expr = group_expr

    else:  # 24HRS Default
        where_tx = "WHERE t.created_at >= NOW() - INTERVAL '24 hours'"
        where_rev = "WHERE f.created_at >= NOW() - INTERVAL '24 hours'"
        group_expr = "DATE_TRUNC('hour', created_at)"
        label_fmt = "%H:00"
        order_expr = group_expr

    return where_tx, where_rev, group_expr, label_fmt, order_expr, params


def get_volume_forensics(
    timeframe: str = "24HRS",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 500,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Inaleta Mzunguko wa Miamala (Volume & Amount) pamoja na Detail Records za Table.
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        where_tx, _, group_expr, label_fmt, order_expr, params = _resolve_time_params(
            timeframe, start_date, end_date
        )

        # 1. Dynamic Query ya Trend Data (Graph)
        # Tunatengeneza GROUP BY query dynamic kulingana na timeframe
        graph_query = f"""
            SELECT 
                {group_expr} AS period,
                COUNT(t.transaction_id) AS total_volume,
                COALESCE(SUM(t.amount), 0) AS total_amount
            FROM transactions t
            {where_tx}
            GROUP BY period
            ORDER BY {order_expr} ASC;
        """
        cursor.execute(graph_query, params if params else None)
        graph_rows = cursor.fetchall()

        chart_data = []
        tf_upper = timeframe.upper() if timeframe else "24HRS"

        for row in graph_rows:
            dt_obj = row[0]
            if isinstance(dt_obj, datetime):
                if tf_upper == "4WEEKS":
                    # Utengenezaji wa Label nadhifu kwa ajili ya Wiki (mfano: Wiki 1, Wiki 2)
                    week_num = (dt_obj.day - 1) // 7 + 1
                    label = f"Wiki {week_num}"
                else:
                    label = dt_obj.strftime(label_fmt)
            else:
                label = str(dt_obj)

            chart_data.append({
                "time_label": label,
                "volume": int(row[1] or 0),
                "amount": float(row[2] or 0.0)
            })

        # 2. Query ya Table Details
        detail_query = f"""
            SELECT 
                t.transaction_id,
                t.type,
                t.amount,
                t.nameOrig,
                t.nameDest,
                t.created_at
            FROM transactions t
            {where_tx}
            ORDER BY t.created_at DESC
            LIMIT %s OFFSET %s;
        """
        detail_params = (params + [limit, offset]) if params else [limit, offset]
        cursor.execute(detail_query, detail_params)
        table_rows = cursor.fetchall()

        table_data = [
            {
                "transaction_id": r[0],
                "type": r[1],
                "amount": float(r[2]),
                "sender": r[3],
                "receiver": r[4],
                "created_at": r[5].strftime("%Y-%m-%d %H:%M:%S") if isinstance(r[5], datetime) else str(r[5])
            }
            for r in table_rows
        ]

        # 3. Total Count
        count_query = f"SELECT COUNT(*) FROM transactions t {where_tx};"
        cursor.execute(count_query, params if params else None)
        total_records = cursor.fetchone()[0] or 0

        cursor.close()
        
        calc_total_volume = sum(item["volume"] for item in chart_data)
        calc_total_amount = sum(item["amount"] for item in chart_data)

        # Inarudisha muundo unaosomeka moja kwa moja na VolumeAnalysis.jsx na Dashboard
        return {
            "total_records": total_records,
            "total_volume": calc_total_volume,
            "total_amount": calc_total_amount,
            "summary": {
                "total_records": total_records,
                "total_volume": calc_total_volume,
                "total_amount": calc_total_amount
            },
            "chart_data": chart_data,
            "table_data": table_data
        }

    except Exception as e:
        logger.error(f"Hitilafu kwenye get_volume_forensics: {str(e)}")
        return {
            "total_records": 0, 
            "total_volume": 0, 
            "total_amount": 0.0,
            "summary": {"total_records": 0, "total_volume": 0, "total_amount": 0.0}, 
            "chart_data": [], 
            "table_data": []
        }
    finally:
        if conn:
            conn.close()


def get_fraud_forensics(
    timeframe: str = "24HRS",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 500,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Inaleta uchambuzi wa Utapeli (Fraud vs Non-Fraud) kwa ku-combine review_queue na predictions.
    """
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        _, where_rev, group_expr, label_fmt, order_expr, params = _resolve_time_params(
            timeframe, start_date, end_date
        )

        # 1. Graph Query: Utapeli vs Miamala Salama (Inatumia alias 'f' ya fraud_review_queue/predictions)
        # Inabadilisha group_expr kwa kurejelea f.created_at
        f_group_expr = group_expr.replace("created_at", "f.created_at")
        f_order_expr = order_expr.replace("created_at", "f.created_at")

        graph_query = f"""
            WITH review_stats AS (
                SELECT 
                    {f_group_expr} AS period,
                    COUNT(CASE WHEN f.final_label = TRUE THEN 1 END) AS confirmed_frauds,
                    COUNT(CASE WHEN f.final_label = FALSE THEN 1 END) AS reviewed_safe
                FROM fraud_review_queue f
                {where_rev}
                GROUP BY period
            ),
            prediction_stats AS (
                SELECT 
                    {f_group_expr} AS period,
                    COUNT(*) AS predicted_safe
                FROM fraud_predictions f
                {where_rev}
                GROUP BY period
            )
            SELECT 
                COALESCE(r.period, p.period) AS period,
                COALESCE(r.confirmed_frauds, 0) AS fraud_count,
                (COALESCE(r.reviewed_safe, 0) + COALESCE(p.predicted_safe, 0)) AS safe_count
            FROM review_stats r
            FULL OUTER JOIN prediction_stats p ON r.period = p.period
            ORDER BY period ASC;
        """
        cursor.execute(graph_query, params if params else None)
        graph_rows = cursor.fetchall()

        chart_data = []
        tf_upper = timeframe.upper() if timeframe else "24HRS"

        for row in graph_rows:
            dt_obj = row[0]
            if isinstance(dt_obj, datetime):
                if tf_upper == "4WEEKS":
                    week_num = (dt_obj.day - 1) // 7 + 1
                    label = f"Wiki {week_num}"
                else:
                    label = dt_obj.strftime(label_fmt)
            else:
                label = str(dt_obj)

            chart_data.append({
                "time_label": label,
                "Miamala ya Utapeli": int(row[1] or 0),
                "Miamala Salama": int(row[2] or 0)
            })

        # 2. Detail Table Query
        detail_query = f"""
            SELECT 
                t.transaction_id,
                t.type,
                t.amount,
                f.fraud_probability,
                f.status,
                COALESCE(f.final_label, FALSE) AS is_fraud,
                f.created_at
            FROM fraud_review_queue f
            JOIN transactions t ON f.transaction_id = t.transaction_id
            {where_rev}
            ORDER BY f.created_at DESC
            LIMIT %s OFFSET %s;
        """
        detail_params = (params + [limit, offset]) if params else [limit, offset]
        cursor.execute(detail_query, detail_params)
        table_rows = cursor.fetchall()

        table_data = [
            {
                "transaction_id": r[0],
                "type": r[1],
                "amount": float(r[2]),
                "fraud_probability": round(float(r[3] or 0.0) * 100, 2),
                "review_status": r[4],
                "final_verdict": "FRAUD" if r[5] else "SAFE",
                "created_at": r[6].strftime("%Y-%m-%d %H:%M:%S") if isinstance(r[6], datetime) else str(r[6])
            }
            for r in table_rows
        ]

        count_query = f"SELECT COUNT(*) FROM fraud_review_queue f {where_rev};"
        cursor.execute(count_query, params if params else None)
        total_records = cursor.fetchone()[0] or 0

        cursor.close()

        total_frauds = sum(item["Miamala ya Utapeli"] for item in chart_data)
        total_safe = sum(item["Miamala Salama"] for item in chart_data)

        return {
            "total_flagged_records": total_records,
            "total_frauds": total_frauds,
            "total_safe": total_safe,
            "summary": {
                "total_flagged_records": total_records,
                "total_frauds": total_frauds,
                "total_safe": total_safe
            },
            "chart_data": chart_data,
            "table_data": table_data
        }

    except Exception as e:
        logger.error(f"Hitilafu kwenye get_fraud_forensics: {str(e)}")
        return {
            "total_flagged_records": 0,
            "total_frauds": 0,
            "total_safe": 0,
            "summary": {"total_flagged_records": 0, "total_frauds": 0, "total_safe": 0},
            "chart_data": [],
            "table_data": []
        }
    finally:
        if conn:
            conn.close()
