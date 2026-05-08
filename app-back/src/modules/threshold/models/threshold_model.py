from sqlalchemy import Column, Integer, Float, String, ForeignKey 
from sqlalchemy.orm import relationship 
from src.utils.database import Base

class ThresholdModel(Base):
    __tablename__ = "thresholds"

    id = Column(Integer, primary_key=True, index=True)
    
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False)
    
    node_id = Column(Integer, nullable=False)
    type = Column(String, nullable=False)
    minval = Column(Float, nullable=False)
    maxval = Column(Float, nullable=False)

    sensor = relationship("SensorModel", back_populates="thresholds")
