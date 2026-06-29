from airflow import DAG

from airflow.providers.standard.operators.python import PythonOperator
from datetime import datetime

from ml.pipeline.tasks.extract import extract_data

from ml.pipeline.tasks.validate import validate_dataset

from ml.pipeline.tasks.train import train_model

from ml.pipeline.tasks.evaluate import evaluate_model

from ml.pipeline.tasks.register import register_model

from ml.pipeline.tasks.compare import compare_models

from ml.pipeline.tasks.activate import activate_best_model


with DAG(

    dag_id="fraud_training_pipeline",

    start_date=datetime(2025,1,1),

    catchup=False,

    schedule="@daily",

    tags=["fraud","mlops"]

) as dag:

    extract = PythonOperator(

        task_id="extract_data",

        python_callable=extract_data

    )

    validate = PythonOperator(

        task_id="validate_dataset",

        python_callable=validate_dataset

    )

    train = PythonOperator(

        task_id="train_model",

        python_callable=train_model

    )

    evaluate = PythonOperator(

        task_id="evaluate_model",

        python_callable=evaluate_model

    )

    register = PythonOperator(

        task_id="register_model",

        python_callable=register_model

    )

    compare = PythonOperator(

        task_id="compare_models",

        python_callable=compare_models

    )

    activate = PythonOperator(

        task_id="activate_best_model",

        python_callable=activate_best_model

    )

    extract >> validate >> train >> evaluate >> register >> compare >> activate
