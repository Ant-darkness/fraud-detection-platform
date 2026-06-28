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

        return cursor.fetchone()

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
                mt.nonfraud_recall DESC;
        """)

        return cursor.fetchall()

    finally:

        cursor.close()
        conn.close()
