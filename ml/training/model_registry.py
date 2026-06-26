from backend.app.database.connection import get_connection


def get_next_version():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT ISNULL(MAX(model_version),0)
        FROM model_registry
        """
    )

    version = cursor.fetchone()[0]

    conn.close()

    return version + 1


def register_model(
    model_name,
    version,
    model_path,
    metrics,
    dataset_size
):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO model_registry(

            model_name,
            model_version,
            model_path,

            precision_score,
            recall_score,
            f1_score,
            roc_auc,

            dataset_size,
            is_active

        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,

        model_name,
        version,
        model_path,

        metrics["precision"],
        metrics["recall"],
        metrics["f1"],
        metrics["roc_auc"],

        dataset_size,
        0
    )

    conn.commit()
    conn.close()
