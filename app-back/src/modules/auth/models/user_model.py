import enum
from sqlalchemy import Column, Integer, String, Enum, Boolean
from sqlalchemy.orm import relationship  # Ajout de l'importation pour les relations
from src.utils.database import Base

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
    is_verified = Column(Boolean, default=False, nullable=False)

    # Relation bidirectionnelle ajoutée pour valider le back_populates de NodeModel
    nodes = relationship("NodeModel", back_populates="user", cascade="all, delete-orphan")
