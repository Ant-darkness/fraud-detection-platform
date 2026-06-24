import pyodbc
import pandas as pd

conn = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=localhost,1455;"
    "DATABASE=FraudDB;"
    "UID=sa;"
    "PWD=Fraud@2026;"
    "Encrypt=no;"
    "TrustServerCertificate=yes;"
)

query = """
SELECT
    step,
    type,
    amount,
    oldbalanceOrg,
    newbalanceOrig,
    oldbalanceDest,
    newbalanceDest,
    isFraud
FROM transactions
"""

print("Loading dataset...")

df = pd.read_sql(query, conn)
df = df.drop_duplicates()

print(df.shape)
print(df["isFraud"].value_counts())

df.to_parquet(
    "backend/ml/fraud_training.parquet",
    index=False
)

print("Saved successfully.")

conn.close()
