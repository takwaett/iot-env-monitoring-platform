from pydantic import BaseModel, ConfigDict

class ThresholdCreate(BaseModel):
    node_id: int
    sensor_id: int   
    type: str  
    minval: float
    maxval: float

class ThresholdResponse(ThresholdCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
