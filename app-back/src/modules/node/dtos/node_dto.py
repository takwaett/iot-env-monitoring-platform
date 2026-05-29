from typing import Optional, List
from pydantic import BaseModel, Field

class NodeCreate(BaseModel):
    name: str 
    localisation: str
    statut: str
    adresseIP: str

class SensorSimple(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class NodeResponse(BaseModel):
    id: int 
    name: str
    localisation: str
    statut: str
    adresseIP: Optional[str] = None
    user_id: int  # Ajouté pour correspondre au nouveau champ du modèle de données
    sensors: List[SensorSimple] = Field(default_factory=list)

    class Config:
        from_attributes = True  # Déplacé correctement à l'intérieur de la classe NodeResponse
