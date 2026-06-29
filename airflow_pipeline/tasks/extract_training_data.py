from pathlib import Path

import pandas as pd

from backend.app.database.connection import get_connection


OUTPUT = Path(
    "/opt/airflow/data/retraining_dataset.parquet"
)


def extract_training_data():

    conn = get_connection()

    query = """
    SELECT

        t.step,
        t.type,
        t.amount,
        t.oldbalanceOrg,
        t.newbalanceOrig,
        t.oldbalanceDest,
        t.newbalanceDest,

        COALESCE(
            fq.final_label,
            FALSE
        ) AS isFraud

    FROM transactions t

    LEFT JOIN fraud_review_queue fq
        ON fq.transaction_id=t.transaction_id

    WHERE

        fq.review_id IS NULL

        OR

        fq.status IN (
            'APPROVED',
            'REJECTED'
        )
    """

    df = pd.read_sql(query, conn)

    conn.close()

    OUTPUT.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    df.to_parquet(
        OUTPUT,
        index=False
    )

    print(df.shape)
