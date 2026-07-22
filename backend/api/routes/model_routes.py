from fastapi import APIRouter, Depends
from backend.app.core.dependencies import get_current_admin, get_current_officer
from backend.app.services.model_service import (
    reload_active_model, get_models, get_active_model,
    activate_model, reject_model, delete_model
)

router = APIRouter(prefix="/models", tags=["Models"])


@router.get("/")
def models(officer=Depends(get_current_officer)):
    return get_models()


@router.get("/active")
def active_model(officer=Depends(get_current_officer)):
    return get_active_model()


@router.post("/reload")
def reload_model(admin=Depends(get_current_admin)):
    return reload_active_model()


@router.put("/{model_id}/activate")
def activate(model_id: int, admin=Depends(get_current_admin)):
    return activate_model(model_id, admin["officer_id"])


@router.put("/{model_id}/reject")
def reject(model_id: int, admin=Depends(get_current_admin)):
    return reject_model(model_id)


@router.delete("/{model_id}")
def delete(model_id: int, admin=Depends(get_current_admin)):
    return delete_model(model_id)
