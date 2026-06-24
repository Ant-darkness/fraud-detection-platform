from ml.inference.predictor import FraudPredictor

predictor = FraudPredictor()


def predict_transaction(data):

    return predictor.predict(data)
