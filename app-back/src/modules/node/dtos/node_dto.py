from typing import Optional, List
from pydantic import BaseModel, Field


from pydantic import BaseModel, Field#tous les modèles héritent de basemodel créé dans database.py

class NodeCreate(BaseModel):
    name: str 
    localisation: str
    statut: str
    adresseIP: str
class SensorSimple(BaseModel):
    id: int
    name: str
class NodeResponse(NodeCreate):
    id: int 
    adresseIP: Optional[str] = None
    name:str
    sensors: List[SensorSimple] = Field(default_factory=list) # Liste des capteurs associés au nœud

    
class Config:
        from_attributes = True
