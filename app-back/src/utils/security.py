from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from fastapi.security import OAuth2PasswordBearer
from src.utils.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = settings.SECRET_KEY  
ALGORITHM = "HS256"


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(subject: str):
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
