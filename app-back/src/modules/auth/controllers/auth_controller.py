import os
import random
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

from src.utils.database import get_db
from src.modules.auth.services.auth_service import AuthService
from src.utils.security import create_access_token, get_password_hash

from src.utils.dependencies import get_current_user 
from src.modules.auth.models.user_model import UserModel as User 
from src.modules.auth.dtos.auth_dto import (
    UserCreate, 
    UserResponse, 
    Token, 
    ResetEmailRequest, 
    PasswordResetConfirm
)

conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("EMAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("EMAIL_PASSWORD"),
    MAIL_FROM = os.getenv("EMAIL_FROM"),
    MAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "EnviroSense"),
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com", 
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

async def send_reset_email(email_to: str, code: str):
    message = MessageSchema(
        subject="Réinitialisation de votre mot de passe",
        recipients=[email_to],
        body=f"Votre code de vérification est : {code}. Il expire dans 10 minutes.",
        subtype=MessageType.plain
    )
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        return True
    except Exception as e:
        print(f"ERREUR SMTP RÉELLE : {e}")
        return False

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    new_user = await AuthService.register(user_in, db)
    return new_user 

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user = await AuthService.authentificate(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    
    token = create_access_token(subject=user.email)
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me") 
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/send-reset-code")
async def send_code(data: ResetEmailRequest, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Email non trouvé")

    code = str(random.randint(100000, 999999))
    user.reset_code = code 
    await db.commit() 

    success = await send_reset_email(data.email, code)
    if success:
        return {"success": True, "message": "Code envoyé"}
    raise HTTPException(status_code=500, detail="Erreur SMTP")

@router.post("/verify-code")
async def verify_code(data: dict, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    email = data.get("email")
    code = data.get("code")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if not user or user.reset_code != code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Le code saisi est incorrect"
        )
    
    
    return {"success": True, "message": "Code correct"}

@router.post("/reset-password")
async def reset_password(data: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    if user.reset_code != data.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Le code saisi est incorrect ou expiré"
        )

    hashed_password = get_password_hash(data.newPassword)
    user.motDePasse = hashed_password
    user.reset_code = None  
    
    await db.commit()
    return {"success": True, "message": "Mot de passe modifié avec succès"}
