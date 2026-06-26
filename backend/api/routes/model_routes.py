from fastapi import APIRouter

from backend.app.services.model_service import reload_model

router = APIRouter(
    prefix="/model",
    tags=["Model"]
)


@router.post("/reload")
def reload():

    return reload_model()
