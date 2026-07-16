from pathlib import Path
import logging
import time

import pandas as pd

from backend.app.database.connection import get_connection


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger(__name__)


OUTPUT_PATH = Path(
    "ml/data/training_feedback.parquet"
)


QUERY = """
SELECT 
    t.transaction_id,
    t.step AS "step",
    t.type AS "type",
    t.amount AS "amount",
    t.oldbalanceOrg AS "oldbalanceOrg",
    t.newbalanceOrig AS "newbalanceOrig",
    t.oldbalanceDest AS "oldbalanceDest",
    t.newbalanceDest AS "newbalanceDest",
    COALESCE(q.final_label, p.prediction) AS "isFraud"
    
FROM transactions t
LEFT JOIN fraud_review_queue q 
    ON t.transaction_id = q.transaction_id 
    AND q.status = 'REVIEWED'
LEFT JOIN fraud_predictions p 
    ON t.transaction_id = p.transaction_id
WHERE 
    q.final_label IS NOT NULL  
    OR p.prediction IS NOT NULL; 

"""

def main():

    start_time = time.time()

    conn = None

    try:

        logger.info("=" * 60)
        logger.info("STARTING DATA EXTRACTION")
        logger.info("=" * 60)

        logger.info("Connecting to PostgreSQL...")

        conn = get_connection()

        logger.info("Database connection established.")

        logger.info("Executing SQL query...")

        df = pd.read_sql(
            QUERY,
            conn
        )

        logger.info(
            "Rows extracted: %s",
            len(df)
        )

        logger.info(
            "Columns: %s",
            len(df.columns)
        )

        if df.empty:

            raise Exception(
                "Training dataset is empty."
            )

        OUTPUT_PATH.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        logger.info(
            "Saving dataset to %s",
            OUTPUT_PATH
        )

        df.to_parquet(
            OUTPUT_PATH,
            index=False
        )

        elapsed = round(
            time.time() - start_time,
            2
        )

        logger.info(
            "Dataset saved successfully."
        )

        logger.info(
            "Execution time: %.2f seconds",
            elapsed
        )

        logger.info("=" * 60)
        logger.info("TRAINING DATA EXTRACTION COMPLETED")
        logger.info("=" * 60)

    except Exception:

        logger.exception(
            "Training data extraction failed."
        )

        raise

    finally:

        if conn is not None:

            conn.close()

            logger.info(
                "Database connection closed."
            )


if __name__ == "__main__":
    main()
