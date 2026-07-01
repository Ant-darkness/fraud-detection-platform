from fastapi import APIRouter, Depends
from backend.app.services.model_service import reload_active_model
from backend.app.core.dependencies import (
    get_current_admin, get_current_officer)
from backend.app.services.model_service import (
    get_models,
    get_active_model,
    activate_model,
    reject_model,
    delete_model,
    promote_model
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
def reload_model(admin=Depends(get_current_admin)):
    return reload_active_model()

@router.put("/{model_id}/activate")
def activate(
    model_id: int,
    admin=Depends(get_current_admin)
):
    return activate_model(
        model_id,
        admin["officer_id"]
    )


@router.put("/{model_id}/reject")
def reject(model_id: int, admin=Depends(get_current_admin)):
    return reject_model(model_id)


@router.delete("/{model_id}")
def delete(

    model_id: int,

    admin=Depends(get_current_admin)

):
    return delete_model(model_id)


@router.put("/models/{model_id}/activate")
def officer_activate(model_id: int, officer=Depends(get_current_admin)):

    return promote_model(
        model_id=model_id,
        officer_id=officer["id"]
    )
