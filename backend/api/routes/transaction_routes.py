from fastapi import APIRouter, Query
from backend.app.services.transaction_service import get_transaction, get_transactions

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/")
def transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100)
):
    return get_transactions(page=page, limit=limit)


@router.get("/{transaction_id}")
def transaction(transaction_id: int):
    return get_transaction(transaction_id)
