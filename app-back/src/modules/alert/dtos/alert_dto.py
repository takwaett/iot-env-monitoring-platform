from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NodeSimple(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class SensorSimple(BaseModel):
    id: int
    type: str
    class Config:
        from_attributes = True

class AlertCreate(BaseModel):
    message: str
    alert: Optional[str] = "UNREAD"
    node_id: Optional[int] = None
    sensor_id: int

class AlertResponse(BaseModel):
    id: int
    message: str
    alert: str
    node_id: Optional[int]
    sensor_id: int
    created_at: datetime
    
    # AJOUT DES RELATIONS : C'est ce qui manque pour l'affichage !
    node: Optional[NodeSimple] = None
    sensor: Optional[SensorSimple] = None

    class Config:
        from_attributes = True