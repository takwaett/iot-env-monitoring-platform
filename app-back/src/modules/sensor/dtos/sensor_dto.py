from datetime import datetime
from typing import Optional

from pydantic import BaseModel

class SensorCreate(BaseModel):
    name: str
    type: str
    node_id: int  
    status: str

class SensorResponse(BaseModel):
    id: int
    name: str
    type: str
    node_id: int
    status: str

    created_at: datetime
    updated_at: Optional[datetime] = None


class Config:
         model_config = {"from_attributes": True}