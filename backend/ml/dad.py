import pandas as pd

df = pd.read_parquet("ml/data/training_feedback.parquet")


print(df["isfraud"].value_counts())

