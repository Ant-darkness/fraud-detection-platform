# backend/api/routes/officer_routes.py

from fastapi import APIRouter, Depends
from backend.app.core.security import hash_password
from backend.app.core.dependencies import (get_current_officer,admin_required)
from backend.app.services.officer_service import (
    register_officer,
    list_officers,
    get_officer_by_id,
    enable_officer,
    disable_officer
)

router = APIRouter(
    prefix="/officers",
    tags=["Officers"]
)


@router.post("/register")
def register(full_name: str,
                username: str,
                email: str,
                password: str,
                role: str="OFFICER",
                admin=Depends(admin_required)
                ):
    password_hash = hash_password(password)
    
    return register_officer(full_name=full_name,
                        username=username,email=email,
                        password_hash=password_hash,
                        role=role)


@router.get("/")
def officers(admin=Depends(admin_required)):
    return list_officers()


@router.get("/{officer_id}")
def officer(officer_id: int, admin=Depends(admin_required)):
    return get_officer_by_id(officer_id)



@router.put("/{officer_id}/enable")
def enable(officer_id: int, admin=Depends(admin_required)):
    return enable_officer(officer_id)


@router.put("/{officer_id}/disable")
def disable(officer_id: int, admin=Depends(admin_required)):
    return disable_officer(officer_id)
