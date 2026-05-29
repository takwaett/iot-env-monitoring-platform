from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException, status
from src.modules.auth.models.user_model import UserModel
from src.modules.auth.dtos.auth_dto import UserCreate 
from src.utils.security import verify_password, get_password_hash 

class AuthService:
    @staticmethod
    async def authentificate(email: str, password: str, db: AsyncSession):
        result = await db.execute(select(UserModel).where(UserModel.email == email))
        user = result.scalars().first()
        
        if not user or not verify_password(password, user.motDePasse):
            return None
            
        # Optionnel : Bloquer la connexion si l'utilisateur n'est pas vérifié
        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Veuillez vérifier votre compte par email avant de vous connecter."
            )
            
        return user

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
            role=user_data.role,
            is_verified=False,  # Forcé à False à l'inscription
            reset_code=None     # Initialisé à vide
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
    async def save_reset_code(email: str, code: str, db: AsyncSession):
        """Enregistre le code de réinitialisation/vérification généré pour l'utilisateur."""
        try:
            query = (
                update(UserModel)
                .where(UserModel.email == email)
                .values(reset_code=code)
            )
            result = await db.execute(query)
            await db.commit()
            if result.rowcount == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Utilisateur introuvable."
                )
            return True
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur lors de la sauvegarde du code : {str(e)}"
            )

    @staticmethod
    async def verify_user_code(email: str, code: str, db: AsyncSession):
        """Valide le code et active le compte de l'utilisateur (is_verified)."""
        result = await db.execute(select(UserModel).where(UserModel.email == email))
        user = result.scalars().first()
        
        if not user or user.reset_code != code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Code de vérification invalide ou email incorrect."
            )
            
        user.is_verified = True
        user.reset_code = None  # Consomme le code pour qu'il ne soit plus réutilisable
        
        try:
            await db.commit()
            return True
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur lors de la validation du compte : {str(e)}"
            )

    @staticmethod
    async def update_password(email: str, code: str, new_password: str, db: AsyncSession):
        """Vérifie le code de réinitialisation avant de mettre à jour le mot de passe."""
        result = await db.execute(select(UserModel).where(UserModel.email == email))
        user = result.scalars().first()
        
        if not user or user.reset_code != code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Code de réinitialisation invalide."
            )
            
        hashed_password = get_password_hash(new_password)
        user.motDePasse = hashed_password
        user.reset_code = None  # Consomme le code
        
        try:
            await db.commit()
            return True
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur lors de la mise à jour du mot de passe : {str(e)}"
            )
    @staticmethod
    async def verify_reset_code(email: str, code: str, db: AsyncSession) -> bool:
        """Vérifie si le code de réinitialisation est correct sans le consommer."""
        result = await db.execute(select(UserModel).where(UserModel.email == email))
        user = result.scalars().first()
        
        # Sécurité : Si l'utilisateur n'existe pas ou s'il n'y a aucun code actif en BDD
        if not user or not user.reset_code:
            return False
            
        # Comparaison stricte en forçant le type en chaîne de caractères
        if user.reset_code != str(code):
            return False
            
        return True
