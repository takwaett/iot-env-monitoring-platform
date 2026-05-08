from sqlalchemy import Column, Integer, String, Enum
from src.utils.database import Base
import enum  #role 

class RoleEnum(str, enum.Enum):
    admin = "admin"
    user = "user"

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    prenom = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    motDePasse = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.user)
    reset_code = Column(String, nullable=True)
