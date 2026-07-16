from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from pydantic import BaseModel, EmailStr
from backend.app.services.auth_service import login
from backend.app.services.password_service import (
    change_password,
    generate_and_save_token,
    verify_token_and_reset_password
)
from backend.app.services.notification_service import send_reset_password_email
from backend.app.core.dependencies import get_current_officer

router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- Schemas ---


class LoginRequest(BaseModel):
    email: str
    password: str


class ChangePasswordRequest(BaseModel):
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordConfirmRequest(BaseModel):
    token: str
    new_password: str


# --- Endpoints ---
@router.post("/login")
def officer_login(data: LoginRequest):
    return login(data.email, data.password)


@router.post("/change-password")
def change_password_route(data: ChangePasswordRequest, officer=Depends(get_current_officer)):
    # Inatumika pale ambapo mtu yupo logged in na anataka kubadili password
    change_password(officer["officer_id"], data.new_password)
    return {"message": "Password updated successfully"}


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    """Hapa ndipo afisa anapoomba token ya kurejesha nenosiri (hajalogin)"""
    try:
        # 1. Tengeneza token kwenye Database
        token = generate_and_save_token(request.email)

        # 2. Kama afisa yupo, tuma barua pepe kama Background Task
        if token:
            background_tasks.add_task(
                send_reset_password_email,
                request.email,
                token
            )

        # Kwa usalama, tunarudisha ujumbe uleule hata kama email haipo kwenye DB
        return {"message": "Kama akaunti yako ipo kwenye mfumo wetu, tumekutumia maelekezo kwenye barua pepe yako."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset-password-confirm")
async def reset_password_confirm(request: ResetPasswordConfirmRequest):
    """Mtumiaji anapoweka password mpya kwa kutumia token aliyotumiwa kwenye email"""
    try:
        success = verify_token_and_reset_password(
            request.token, request.new_password)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token si sahihi, imeshatumika, au imekwisha muda wake."
            )
        return {"success": True, "message": "Nenosiri jipya limesajiliwa kikamilifu!"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
