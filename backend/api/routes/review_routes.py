from fastapi import APIRouter, Depends
from backend.app.core.dependencies import get_current_officer
from backend.app.services.review_service import (
    get_pending_reviews,
    approve_review,
    reject_review
)

router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
)


@router.get("/pending")
def pending(officer=Depends(get_current_officer)):

    return get_pending_reviews()


@router.put("/{review_id}/approve")
def approve(
    review_id: int,
    officer=Depends(get_current_officer)
):

    return approve_review(
        review_id,
        officer["full_name"]
    )


@router.put("/{review_id}/reject")
def reject(
    review_id: int,
    officer=Depends(get_current_officer)
):

    return reject_review(
        review_id,
        officer["full_name"]
    )
