from fastapi import FastAPI

from backend.api.schemas import (
    TransactionRequest
)

from ml.inference.predictor import (
    FraudPredictor
)

app = FastAPI()

predictor = FraudPredictor()


@app.get("/")
def health():

    return {
        "status": "running"
    }


@app.post("/predict")
def predict(
    request: TransactionRequest
):

    result = predictor.predict(
        request.model_dump()
    )

    return result


@app.get("/health")
def health():

    return {
        "status": "healthy",
        "model": "fraud_detector_v1"
    }
    

@app.get("/reviews/pending")
def get_pending_reviews():
    cursor.execute("""
        SELECT
            review_id,
            transaction_id,
            fraud_probability,
            status
        FROM fraud_review_queue
        WHERE status='PENDING'
    """)

    rows = cursor.fetchall()

    return [
        {
            "review_id": r.review_id,
            "transaction_id": r.transaction_id,
            "fraud_probability": float(r.fraud_probability),
            "status": r.status
        }
        for r in rows
    ]

@app.put("/reviews/{review_id}/approve")
def approve_review(review_id: int, officer_name: str):
    cursor.execute(
    """
    UPDATE fraud_review_queue
    SET
        status='APPROVED',
        final_label=1,
        review_at=GETDATE()
    WHERE review_id=?
    """,
    review_id
    )
    
    conn.commit()
    
    return {"message": "approved"}

@app.put("/reviews/{review_id}/reject")
def reject_review(review_id: int):
    cursor.execute(
        """
        UPDATE fraud_review_queue
        SET
            status='REJECTED',
            final_label=0,
            reviewed_at=GETDATE()
        WHERE review_id=?
        """,
        review_id
    )

    conn.commit()

    return {"message": "rejected"}

