from fastapi import APIRouter, Depends, HTTPException, status
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


class LoginRequest(BaseModel):
    email: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordConfirmRequest(BaseModel):
    token: str
    new_password: str


class ForceChangePasswordRequest(BaseModel):
    new_password: str


@router.post("/login")
def officer_login(data: LoginRequest):
    try:
        return login(data.email, data.password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/change-password")
def change_password_route(data: ChangePasswordRequest, officer=Depends(get_current_officer)):
    try:
        change_password(
            officer_id=officer["officer_id"],
            old_password=data.old_password,
            new_password=data.new_password
        )
        return {"message": "Nenosiri limebadilishwa kikamilifu."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    try:
        token = generate_and_save_token(request.email)
        if token:
            await send_reset_password_email(request.email, token)
        return {
            "success": True,
            "message": "Kama akaunti yako ipo kwenye mfumo, token ya usalama imetumwa kwenye barua pepe yako."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset-password-confirm")
async def reset_password_confirm(request: ResetPasswordConfirmRequest):
    try:
        success = verify_token_and_reset_password(
            request.token, request.new_password
        )
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


@router.post("/force-change-password")
def force_change_password_route(data: ForceChangePasswordRequest, officer=Depends(get_current_officer)):
    try:
        change_password(
            officer_id=officer["officer_id"],
            old_password=None,
            new_password=data.new_password
        )
        return {"message": "Nenosiri la lazima limebadilishwa kikamilifu."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
