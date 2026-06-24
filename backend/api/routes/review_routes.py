from fastapi import APIRouter

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
def pending():

    return get_pending_reviews()


@router.put("/{review_id}/approve")
def approve(
    review_id: int,
    officer_name: str
):

    return approve_review(
        review_id,
        officer_name
    )


@router.put("/{review_id}/reject")
def reject(
    review_id: int,
    officer_name: str
):

    return reject_review(
        review_id,
        officer_name
    )
