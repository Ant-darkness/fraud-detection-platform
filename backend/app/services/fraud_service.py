from ml.inference.predictor import FraudPredictor

predictor = FraudPredictor()


def score_transaction(transaction):

    result = predictor.predict(transaction)

    return result
