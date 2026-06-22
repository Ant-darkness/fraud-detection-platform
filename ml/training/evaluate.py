# ml/training/evaluate.py

import pandas as pd


def summarize_results(results):

    df = pd.DataFrame(results)

    summary = df.mean()

    return summary.to_dict()
