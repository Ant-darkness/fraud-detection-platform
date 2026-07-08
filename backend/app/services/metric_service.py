from backend.app.database.connection import get_connection


def get_metrics(model_id: int):

    conn = get_connection()

    try:

        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                precision_score,
                recall_score,
                f1_score,
                roc_auc,
                fraud_recall,
                nonfraud_recall,
                created_at
            FROM metric_registry
            WHERE model_id=%s
        """, (model_id,))
        
        row = cursor.fetchone()
        
        if not row:
            return None

        return {
            "precision_score": row[0],
            "recall_score": row[1],
            "f1_score": row[2],
            "roc_auc": row[3],
            "fraud_recall": row[4],
            "nonfraud_recall": row[5],
            "created_at": row[6]
        }

    finally:

        cursor.close()
        conn.close()


def get_leaderboard():

    conn = get_connection()

    try:

        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                mr.model_id,
                mr.model_name,
                mr.model_version,
                mt.precision_score,
                mt.recall_score,
                mt.f1_score,
                mt.roc_auc,
                mt.fraud_recall,
                mt.nonfraud_recall
            FROM model_registry mr
            JOIN metric_registry mt
            ON mr.model_id = mt.model_id
            ORDER BY
                mt.f1_score DESC,
                mt.fraud_recall DESC,
                mt.nonfraud_recall DESC
        """)

        rows = cursor.fetchall()

        return [
            {
                "model_id": r[0],
                "model_name": r[1],
                "model_version": r[2],
                "precision_score": r[3],
                "recall_score": r[4],
                "f1_score": r[5],
                "roc_auc": r[6],
                "fraud_recall": r[7],
                "nonfraud_recall": r[8]
            }
            for r in rows]

    finally:

        cursor.close()
        conn.close()
