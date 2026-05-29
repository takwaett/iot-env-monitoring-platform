import random
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from src.utils.database import get_db
from src.modules.auth.services.auth_service import AuthService
from src.utils.security import create_access_token
from src.utils.dependencies import get_current_user 
from src.utils.email import send_auth_email  # Utilisation du module d'email global

from src.modules.auth.models.user_model import UserModel as User 
from src.modules.auth.dtos.auth_dto import (
    UserCreate, 
    UserResponse, 
    Token, 
    ResetEmailRequest, 
    PasswordResetConfirm
)

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # 1. Enregistrement de l'utilisateur (is_verified initialisé à False)
    new_user = await AuthService.register(user_in, db)
    
    # 2. Génération et envoi du code de validation de compte
    code = str(random.randint(100000, 999999))
    await AuthService.save_reset_code(new_user.email, code, db)
    
    # Mode "verification" aligné avec votre email.py
    await send_auth_email(new_user.email, code, mode="verification")
        
    return new_user 

@router.post("/verify-account")
async def verify_account(data: dict, db: AsyncSession = Depends(get_db)):
    """Valide l'activation du compte de l'utilisateur après inscription."""
    email = data.get("email")
    code = data.get("code")
    if not email or not code:
        raise HTTPException(status_code=400, detail="Champs email et code requis.")
        
    await AuthService.verify_user_code(email, code, db)
    return {"success": True, "message": "Votre compte a été vérifié et activé avec succès."}

@router.post("/resend-verification")
async def resend_verification(data: ResetEmailRequest, db: AsyncSession = Depends(get_db)):
    """Génère et renvoie un nouveau code d'activation pour le Frontend."""
    code = str(random.randint(100000, 999999))
    
    # Met à jour le code en BDD via le service
    await AuthService.save_reset_code(data.email, code, db)

    # Renvoi de l'email avec le mode "verification"
    success = await send_auth_email(data.email, code, mode="verification")
    if success:
        return {"success": True, "message": "Nouveau code de vérification envoyé."}
    raise HTTPException(status_code=500, detail="Erreur lors du renvoi de l'e-mail.")

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await AuthService.authentificate(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=401, detail="Identifiants incorrects ou compte non vérifié")
    
    token = create_access_token(subject=user.email)
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse) 
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/send-reset-code")
async def send_code(data: ResetEmailRequest, db: AsyncSession = Depends(get_db)):
    code = str(random.randint(100000, 999999))
    
    # Enregistrement en BDD via le service
    await AuthService.save_reset_code(data.email, code, db)

    # Envoi du message en mode "reset"
    success = await send_auth_email(data.email, code, mode="reset")
    if success:
        return {"success": True, "message": "Code de réinitialisation envoyé"}
    raise HTTPException(status_code=500, detail="Erreur lors de l'envoi de l'e-mail.")

@router.post("/verify-code")
async def verify_code(data: dict, db: AsyncSession = Depends(get_db)):
    email = data.get("email")
    code = data.get("code")
    
    if not email or not code:
        raise HTTPException(status_code=400, detail="Champs email et code requis.")
        
    is_valid = await AuthService.verify_reset_code(email, code, db)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Code de réinitialisation invalide ou expiré.")
        
    return {"success": True, "message": "Code vérifié avec succès"}



@router.post("/reset-password")
async def reset_password(data: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    # Utilisation de la logique centralisée du service
    await AuthService.update_password(
        email=data.email, 
        code=data.code, 
        new_password=data.newPassword, 
        db=db
    )
    return {"success": True, "message": "Mot de passe modifié avec succès"}
