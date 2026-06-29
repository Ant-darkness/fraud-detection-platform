import pandas as pd

from backend.app.database.connection import get_connection


def load_training_data():

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
        ON t.transaction_id = fq.transaction_id

    WHERE
        fq.status='APPROVED'
        OR fq.status='REJECTED'
        OR fq.review_id IS NULL
    """

    df = pd.read_sql(query, conn)

    conn.close()

    return df
