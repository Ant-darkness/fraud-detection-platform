from fastapi import APIRouter

from backend.api.schemas import (
    TransactionRequest
)

from backend.app.services.prediction_service import (
    predict_transaction
)

router = APIRouter(
    prefix="/prediction",
    tags=["Prediction"]
)


@router.post("/")
def predict(
    request: TransactionRequest
):

    return predict_transaction(
        request.model_dump()
    )
