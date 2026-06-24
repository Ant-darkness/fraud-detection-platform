from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def root():

    return {
        "status": "running"
    }


@router.get("/health")
def health():

    return {
        "status": "healthy"
    }
