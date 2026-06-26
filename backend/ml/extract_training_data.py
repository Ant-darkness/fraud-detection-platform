import pyodbc
import pandas as pd


conn = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=sqlserver,1433;"
    "DATABASE=FraudDB;"
    "UID=sa;"
    "PWD=Fraud@2026;"
    "Encrypt=no;"
    "TrustServerCertificate=yes;"
)

query = """
SELECT

    t.step,
    t.type,
    t.amount,
    t.oldbalanceOrg,
    t.newbalanceOrig,
    t.oldbalanceDest,
    t.newbalanceDest,

    f.final_label AS isFraud

FROM transactions t

INNER JOIN training_feedback f
ON t.transaction_id = f.transaction_id
"""
def main():

    df = pd.read_sql(query, conn)

    print(df.shape)

    df.to_parquet(
        "ml/data/training_feedback.parquet",
        index=False
    )

    print("Training dataset created.")
