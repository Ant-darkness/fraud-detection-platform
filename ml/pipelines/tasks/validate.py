import pandas as pd


def validate_dataset(**context):
    """
    Loads dataset from XCom and validates it.
    """

    dataset = context["ti"].xcom_pull(
        key="dataset",
        task_ids="extract_data"
    )

    df = pd.read_json(dataset)

    # Dataset must not be empty
    if df.empty:
        raise Exception("Dataset is empty.")

    # Target column must exist
    if "isFraud" not in df.columns:
        raise Exception("Target column missing.")

    # Pass validated dataset forward
    context["ti"].xcom_push(
        key="validated_dataset",
        value=df.to_json()
    )
