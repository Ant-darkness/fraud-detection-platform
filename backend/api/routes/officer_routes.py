from fastapi import APIRouter, Depends
from backend.app.core.security import hash_password
from backend.app.core.dependencies import (
    get_current_officer, get_current_admin)
from backend.app.services.officer_service import (
    create_officer,
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
def create_officer(full_name: str,
                username: str,
                email: str,
                password: str,
                role: str="OFFICER",
                   admin=Depends(get_current_admin)
                ):
    password = hash_password(password)
    
    return create_officer(full_name=full_name,
                        username=username,email=email,
                        password=password,
                        role=role)


@router.get("/")
def officers(admin=Depends(get_current_admin)):
    return list_officers()


@router.get("/{officer_id}")
def officer(officer_id: int, admin=Depends(get_current_admin)):
    return get_officer_by_id(officer_id)



@router.put("/{officer_id}/enable")
def enable(officer_id: int, admin=Depends(get_current_admin)):
    return enable_officer(officer_id)


@router.put("/{officer_id}/disable")
def disable(officer_id: int, admin=Depends(get_current_admin)):
    return disable_officer(officer_id)

