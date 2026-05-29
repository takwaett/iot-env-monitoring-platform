from sqlalchemy import Column, Integer, String, ForeignKey
from src.utils.database import Base
from sqlalchemy.orm import relationship

class NodeModel(Base):
    __tablename__ = "nodes" 
    
    id = Column(Integer, primary_key=True, index=True) 
    name = Column(String)
    localisation = Column(String)
    statut = Column(String)
    adresseIP = Column(String)
    
    # 1. Ajout de la clé étrangère vers l'utilisateur connecté
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 2. Vos relations existantes (conservées sans aucune modification)
    alerts = relationship("AlertModel", back_populates="node")
    sensors = relationship("SensorModel", back_populates="node")
    
    # 3. Optionnel : Relation pour remonter facilement du nœud vers l'utilisateur
    user = relationship("UserModel", back_populates="nodes")
