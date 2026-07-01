from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix
)


def calculate_metrics(y_true, y_pred, y_prob):

    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    
    fraud_recall = recall_score(
        y_true,
        y_pred,
        pos_label=1,
        zero_division=0
    )


    nonfraud_recall = recall_score(
        y_true,
        y_pred,
        pos_label=0,
        zero_division=0
    )

    # ROC-AUC SAFE GUARD
    if len(set(y_true)) < 2:
        roc_auc = 0.0
        pr_auc = 0.0
    else:
        roc_auc = roc_auc_score(y_true, y_prob)
        pr_auc = average_precision_score(y_true, y_prob)

    return {
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "fraud_recall": fraud_recall,
        "nonfraud_recall": nonfraud_recall,
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "roc_auc": roc_auc,
        "pr_auc": pr_auc,
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn
    }
