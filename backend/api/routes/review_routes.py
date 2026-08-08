from fastapi import APIRouter, Depends, Query
from backend.app.core.dependencies import get_current_officer
from backend.app.services.review_service import get_pending_reviews, approve_review, reject_review

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("/pending")
def pending(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    officer=Depends(get_current_officer)
):
    return get_pending_reviews(page=page, limit=limit)


@router.put("/{review_id}/approve")
def approve(review_id: int, officer=Depends(get_current_officer)):
    return approve_review(review_id, officer["officer_id"])


@router.put("/{review_id}/reject")
def reject(review_id: int, officer=Depends(get_current_officer)):
    return reject_review(review_id, officer["officer_id"])
