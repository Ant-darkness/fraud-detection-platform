from backend.app.database.connection import get_connection
from ml.training.model_registry import get_next_version
from backend.app.services.model_service import (
    get_latest_model_metrics,
    promote_model,
    is_new_model_better
)

def airflow_activate_logic():

    should_activate, reason = is_new_model_better()

    if not should_activate:
        print(f"Skipping activation: {reason}")
        return

    latest = get_latest_model_metrics()

    promote_model(latest["model_id"])

    print("Model promoted by Airflow")
