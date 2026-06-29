from ml.inference.predictor import FraudPredictor

from backend.app.services.transaction_service import save_transaction
from backend.app.services.review_service import add_to_review_queue
# from backend.app.services.notification_service import notify_officers

predictor = FraudPredictor()


def predict_transaction(data):

    # 1. Hifadhi transaction kwanza
    transaction_id = save_transaction(data)

    # 2. Fanya prediction
    result = predictor.predict(data)

    # 3. Ikiwa ni fraud iingize review queue
    if result["prediction"] == 1:

        add_to_review_queue(
            transaction_id=transaction_id,
            fraud_probability=result["fraud_probability"]
        )

        # notify_officers(transaction_id)

    # 4. Rudisha majibu pamoja na transaction id
    result["transaction_id"] = transaction_id

    return result


def reload_model():

    predictor.reload_model()

    return {
        "message": "Model reloaded successfully"
    }
