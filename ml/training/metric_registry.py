from backend.app.database.connection import get_connection


def register_metrics(
    model_id,
    metrics
):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO metric_registry(

            model_id,
            precision_score,
            recall_score,
            f1_score,
            roc_auc,
            fraud_recall,
            nonfraud_recall

        )
        VALUES(%s,%s,%s,%s,%s,%s,%s)
        """,
        (
            model_id,
            metrics["precision"],
            metrics["recall"],
            metrics["f1"],
            metrics["roc_auc"],
            metrics["fraud_recall"],
            metrics["nonfraud_recall"]
        )
    )

    conn.commit()

    cursor.close()
    conn.close()
