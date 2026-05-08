from sqlalchemy import Column, Integer, String
from src.utils.database import Base, engine, AsyncSessionLocal
from sqlalchemy.orm import relationship
#engine:moteur

class NodeModel(Base):
    __tablename__ = "nodes" 
    id = Column(Integer, primary_key=True, index=True) 
    name = Column(String)
    localisation = Column(String)
    statut = Column(String)
    adresseIP = Column(String)
    alerts = relationship("AlertModel", back_populates="node")

    sensors = relationship("SensorModel", back_populates="node")