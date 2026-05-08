from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class MeasurementImportDTO(BaseModel):
    node_id: int
    value: float 
    sensor_name: str 
    type: str 


class MeasurementCreate(BaseModel):
    sensor_id: int
    value: float

class MeasurementResponse(BaseModel):
    id: int
    sensor_id: int
    value: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
