from pydantic import BaseModel


class MetricResponse(BaseModel):

    precision_score: float
    recall_score: float
    f1_score: float
    roc_auc: float
    fraud_recall: float
    nonfraud_recall: float
    class Config:
        from_attributes = True
