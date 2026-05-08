from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from datetime import datetime
from src.utils.database import Base

class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    alert = Column(String, default="UNREAD") 

    node_id = Column(Integer, ForeignKey("nodes.id"), nullable=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False)

    node = relationship("NodeModel", back_populates="alerts")
    sensor = relationship("SensorModel", back_populates="alerts")