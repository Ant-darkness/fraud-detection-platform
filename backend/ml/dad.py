import pandas as pd

df = pd.read_parquet("backend/ml/fraud_training.parquet")

print(df.shape)
print(df["isFraud"].value_counts())
print(df.dtypes)
