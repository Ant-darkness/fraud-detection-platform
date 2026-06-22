import pandas as pd

df = pd.read_parquet(
    "backend/ml/fraud_training.parquet"
)

assert len(df) > 1000

assert df.isnull().sum().sum() == 0

print("Data quality passed")
