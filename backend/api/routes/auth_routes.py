from fastapi import APIRouter

from backend.app.services.auth_service import login

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/login")
def officer_login(
    username: str,
    password: str
):

    return login(
        username,
        password
    )
