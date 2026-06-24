from ml.training.metrics import calculate_metrics


def evaluate_model(model, X, y):

    # predictions
    y_pred = model.predict(X)

    # probabilities
    y_prob = model.predict_proba(X)[:, 1]

    # delegate all logic to metrics.py
    metrics = calculate_metrics(
        y_true=y,
        y_pred=y_pred,
        y_prob=y_prob
    )

    return metrics
