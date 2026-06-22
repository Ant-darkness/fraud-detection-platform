
from pathlib import Path

import pandas as pd


RANDOM_STATE = 42
NON_FRAUD_SAMPLE = 300_000

INPUT_FILE = Path("ml/data/fraud_training.parquet")
OUTPUT_FILE = Path("ml/data/train_sample.parquet")


def main():

    print("Loading dataset...")

    df = pd.read_parquet(INPUT_FILE)

    print(df.shape)

    fraud_df = df[df["isFraud"] == True]

    normal_df = df[df["isFraud"] == False]

    sampled_normal = normal_df.sample(
        n=NON_FRAUD_SAMPLE,
        random_state=RANDOM_STATE
    )

    final_df = pd.concat(
        [fraud_df, sampled_normal],
        ignore_index=True
    )

    final_df = final_df.sample(
        frac=1,
        random_state=RANDOM_STATE
    ).reset_index(drop=True)

    print(final_df.shape)

    print(final_df["isFraud"].value_counts())

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    final_df.to_parquet(
        OUTPUT_FILE,
        index=False
    )

    print("Sample dataset saved.")


if __name__ == "__main__":
    main()
