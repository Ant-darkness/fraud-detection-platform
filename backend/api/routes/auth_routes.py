from backend.app.services.password_service import change_password
from fastapi import Depends
from backend.app.core.dependencies import get_current_officer
from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.services.auth_service import login

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

class LoginRequest(BaseModel):
    email: str
    password: str
    
class ChangePasswordRequest(BaseModel):
    new_password: str

@router.post("/login")
def officer_login(data: LoginRequest):

    return login(
        data.email,
        data.password
    )


@router.post("/change-password")
def change_password_route(
    data: ChangePasswordRequest,
    officer=Depends(get_current_officer)
):

    change_password(officer["officer_id"], data.new_password)

    return {"message": "Password updated successfully"}
