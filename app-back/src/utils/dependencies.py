from fastapi import Depends, HTTPException, status
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.utils.config import settings
from src.utils.security import oauth2_scheme
from src.utils.database import get_db 
from src.modules.auth.models.user_model import UserModel
from src.utils.database import AsyncSessionLocal, Base, engine
from src.utils.database import AsyncSessionLocal 



async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session expirée ou invalide.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
       
        email: str = payload.get("sub")
        if not email:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    
    query = select(UserModel).where(UserModel.email == email)
    result = await db.execute(query)
    user = result.scalars().first()

    if user is None:
        raise credentials_exception

    return user
