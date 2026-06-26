from ml.inference.predictor import predictor


def reload_model():

    predictor.reload_model()

    return {
        "message": "Model reloaded successfully"
    }
