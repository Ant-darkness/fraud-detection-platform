from fastapi import APIRouter

from backend.app.services.transaction_service import (
    get_transaction,
    get_transactions
)

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)


@router.get("/")
def transactions():
    return get_transactions()


@router.get("/{transaction_id}")
def transaction(transaction_id: int):
    return get_transaction(transaction_id)
