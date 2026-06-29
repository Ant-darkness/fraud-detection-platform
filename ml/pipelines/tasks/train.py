import pandas as pd

from ml.training.trainer import train


def train_model(**context):
    """
    Airflow Training Task
    """

    dataset = context["ti"].xcom_pull(
        key="validated_dataset",
        task_ids="validate_dataset"
    )

    df = pd.read_json(dataset)

    model, X_test, y_test = train(df)

    context["ti"].xcom_push(
        key="X_test",
        value=X_test.to_json()
    )

    context["ti"].xcom_push(
        key="y_test",
        value=y_test.to_json()
    )
