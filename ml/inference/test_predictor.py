from ml.inference.predictor import FraudPredictor

predictor = FraudPredictor()

sample = {

    "step": 1,

    "type": "TRANSFER",

    "amount": 500000,

    "oldbalanceOrg": 500000,

    "newbalanceOrig": 0,

    "oldbalanceDest": 0,

    "newbalanceDest": 0
}

result = predictor.predict(
    sample
)

print(result)
