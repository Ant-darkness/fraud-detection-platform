from ml.data.extract import extract_dataset


def extract_data(**context):
    """
    Airflow task.

    Extract dataset then store it in XCom
    for the next task.
    """

    df = extract_dataset()

    context["ti"].xcom_push(
        key="dataset",
        value=df.to_json()
    )
