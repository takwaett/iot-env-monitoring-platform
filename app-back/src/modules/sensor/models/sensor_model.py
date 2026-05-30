# src/modules/sensor/models/sensor_model.py
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, func
from src.utils.database import Base
from sqlalchemy.orm import relationship

class SensorModel(Base):
    __tablename__ = "sensors" 
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    status = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())   

    # Capteur lié à un noeud
    node_id = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    
    # Lien vers noeud parent
    node = relationship("NodeModel", back_populates="sensors")

    
    thresholds = relationship("ThresholdModel", back_populates="sensor", cascade="all, delete-orphan")
    measurement = relationship("MeasurementModel", back_populates="sensor", cascade="all, delete-orphan")
    alerts = relationship("AlertModel", back_populates="sensor", cascade="all, delete-orphan")
