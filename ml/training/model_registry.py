from backend.app.database.connection import (
    create_connection
)


def get_next_version():

    conn = create_connection()

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT
            ISNULL(
                MAX(model_version),
                0
            )
        FROM model_registry
        """
    )

    current = cursor.fetchone()[0]

    conn.close()

    return current + 1

def register_model(
    model_name,
    version,
    model_path,
    dataset_size,
    precision_score,
    recall_score,
    f1_score,
    roc_auc
):

    conn = create_connection()

    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO model_registry(

            model_name,
            model_version,
            model_path,
            dataset_size,
            precision_score,
            recall_score,
            f1_score,
            roc_auc,
            is_active

        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        """,

        model_name,
        version,
        model_path,
        dataset_size,
        precision_score,
        recall_score,
        f1_score,
        roc_auc
    )

    conn.commit()

    conn.close()
