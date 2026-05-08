from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, func
from src.utils.database import Base
from sqlalchemy.orm import relationship
from datetime import datetime



class MeasurementModel(Base):
    __tablename__ = "measurement"

    id = Column(Integer, primary_key=True, index=True)
 
    value = Column(Float, nullable=False) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False)
    sensor = relationship("SensorModel", back_populates="measurement")
