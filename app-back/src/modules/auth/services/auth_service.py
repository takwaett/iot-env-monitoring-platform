from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from sqlalchemy import select, update
from src.modules.auth.models.user_model import UserModel
from src.modules.auth.dtos.auth_dto import UserCreate 
from src.utils.security import verify_password, get_password_hash 

class AuthService:
    @staticmethod
    async def authentificate(email, password, db: AsyncSession):
        result = await db.execute(select(UserModel).where(UserModel.email == email))
        user = result.scalars().first()
        if user and verify_password(password, user.motDePasse):
            return user
        return None

    @staticmethod
    async def register(user_data: UserCreate, db: AsyncSession):
        query = select(UserModel).where(UserModel.email == user_data.email)
        result = await db.execute(query)
        if result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cet email est déjà enregistré."
            )

        hashed_pwd = get_password_hash(user_data.motDePasse)
        new_user = UserModel(
            nom=user_data.nom,
            prenom=user_data.prenom,
            email=user_data.email,
            motDePasse=hashed_pwd,
            role=user_data.role
        )
        db.add(new_user)
        try:
            await db.commit() 
            await db.refresh(new_user) 
            return new_user
        except Exception as e:
            await db.rollback() 
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur base de données : {str(e)}"
            )
    @staticmethod
    async def update_password(email: str, hashed_password: str, db: AsyncSession):
        try:
            query = (
                update(UserModel)
                .where(UserModel.email == email)
                .values(motDePasse=hashed_password)
            )
            result = await db.execute(query)
            await db.commit()
            
            return result.rowcount > 0
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur lors de la mise à jour du mot de passe : {str(e)}"
            )