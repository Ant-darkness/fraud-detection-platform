from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from backend.app.core.security import (
    SECRET_KEY,
    ALGORITHM
)
from backend.app.services.officer_service import (
    get_officer_by_id
)

security = HTTPBearer()


def get_current_officer(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    officer = get_officer_by_id(
        payload["officer_id"]
    )

    if officer is None:
        raise HTTPException(
            status_code=401,
            detail="Officer not found"
        )

    if not officer["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="Officer disabled"
        )

    return officer


def admin_required(
    officer=Depends(get_current_officer)
):

    if officer["role"] != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin only"
        )

    return officer
