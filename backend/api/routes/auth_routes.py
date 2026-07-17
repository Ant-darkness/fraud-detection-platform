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

# Schema imeboreshwa ili kulazimisha old_password kwa usalama


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordConfirmRequest(BaseModel):
    token: str
    new_password: str


# --- Endpoints ---

@router.post("/login")
def officer_login(data: LoginRequest):
    try:
        return login(data.email, data.password)
    except Exception as e:
        # Badala ya kutupa kosa la mfumo (500), tunatupa 401 Unauthorized
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/change-password")
def change_password_route(data: ChangePasswordRequest, officer=Depends(get_current_officer)):
    """Inatumika pale ambapo mtu yupo logged in na anataka kubadili password kwa usalama"""
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
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    try:
        token = generate_and_save_token(request.email)
        if token:
            background_tasks.add_task(
                send_reset_password_email,
                request.email,
                token
            )
        return {"message": "Kama akaunti yako ipo kwenye mfumo wetu, tumekutumia maelekezo kwenye barua pepe yako."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset-password-confirm")
async def reset_password_confirm(request: ResetPasswordConfirmRequest):
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

# 1. Ongeza schema mpya isiyo na old_password


class ForceChangePasswordRequest(BaseModel):
    new_password: str

# 2. Ongeza endpoint hii mpya


@router.post("/force-change-password")
def force_change_password_route(data: ForceChangePasswordRequest, officer=Depends(get_current_officer)):
    """
    Inatumika kwa ajili ya mabadiliko ya lazima ya password kwenye login ya kwanza.
    Haitaji 'old_password'.
    """
    try:
        # Hapa tunaita service ya kubadili password, tunapitisha tu password mpya.
        # Kama 'change_password' service yako inalazimisha old_password, unaweza kuandika
        # logic ndogo ya update_password moja kwa moja hapa au kupitisha None.
        change_password(
            officer_id=officer["officer_id"],
            old_password=None,  # Tunaashiria kuwa hii ni force change
            new_password=data.new_password
        )
        return {"message": "Nenosiri la lazima limebadilishwa kikamilifu."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
