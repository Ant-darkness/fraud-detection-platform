from pydantic import BaseModel, EmailStr


class OfficerCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class OfficerResponse(BaseModel):
    officer_id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True
