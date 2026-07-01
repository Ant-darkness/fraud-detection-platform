from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from backend.app.core.security import SECRET_KEY, ALGORITHM
from backend.app.services.officer_service import get_officer_by_id

security = HTTPBearer()


def get_current_officer(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

    except JWTError:
        raise HTTPException(401, "Invalid token")

    officer = get_officer_by_id(payload["officer_id"])

    if not officer:
        raise HTTPException(401, "Officer not found")

    if not officer["is_active"]:
        raise HTTPException(403, "Account disabled")

    return officer


def get_current_admin(
    officer=Depends(get_current_officer)
):

    if officer["role"] != "ADMIN":
        raise HTTPException(403, "Admin only")

    return officer
