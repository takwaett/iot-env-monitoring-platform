from pydantic import BaseModel, EmailStr
from enum import Enum

class RoleEnum(str, Enum):
    admin = "admin"
    user = "user"

class UserCreate(BaseModel):
    nom: str
    prenom: str
    email: EmailStr
    motDePasse: str
    role: RoleEnum = RoleEnum.user

class UserResponse(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    role: RoleEnum

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ResetEmailRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    code: str
    newPassword: str

