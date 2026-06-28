from fastapi import APIRouter, Depends
from backend.app.services.model_service import reload_active_model
from backend.app.core.dependencies import (admin_required, get_current_officer)
from backend.app.services.model_service import (
    get_models,
    get_active_model,
    activate_model,
    reject_model
)

router = APIRouter(
    prefix="/models",
    tags=["Models"]
)


@router.get("/")
def models(officer=Depends(get_current_officer)):
    return get_models()


@router.get("/active")
def active_model():
    return get_active_model(officer=Depends(get_current_officer))

@router.post("/reload")
def reload_model(admin=Depends(admin_required)):
    return reload_active_model()

@router.put("/{model_id}/activate")
def activate(
    model_id: int,
    admin=Depends(admin_required)
):
    return activate_model(
        model_id,
        admin["officer_id"]
    )


@router.put("/{model_id}/reject")
def reject(model_id: int, admin=Depends(admin_required)):
    return reject_model(model_id)
