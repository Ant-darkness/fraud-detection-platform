from pydantic import BaseModel, EmailStr


class OfficerCreate(BaseModel):
    officer_name: str
    email: EmailStr
    password: str


class OfficerResponse(BaseModel):
    officer_id: int
    officer_name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True
