from backend.app.services.transaction_service import save_transaction
from backend.app.services.notification_service import notify_officers

def score_transaction(transaction_data: dict):
    from ml.inference.predictor import predictor
    result = predictor.predict(transaction_data)
    return result

def predict_transaction(transaction_data: dict):
    # Save transaction first
    transaction_id = save_transaction(transaction_data)
    result = score_transaction(transaction_data)
    probability = result.get("probability", 0.0)
    is_fraud = result.get("prediction", False)
    # Optionally insert into fraud_predictions
    # For now, if fraud probability high, trigger notification
    if is_fraud or probability > 0.7:
        notify_officers(transaction_id, probability)
    return {
        "transaction_id": transaction_id,
        "prediction": is_fraud,
        "probability": probability,
        "features": result.get("features", {})
    }
