from ml.inference.predictor import FraudPredictor

predictor = FraudPredictor()


def predict_transaction(data):

    return predictor.predict(data)

def reload_model():
    predictor.reload_model()
    
    return {
        "message": "Model reloaded successfully"
    }
