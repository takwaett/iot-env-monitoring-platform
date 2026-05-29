# src/modules/sensor/dtos/sensor_dto.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator, ConfigDict

class SensorCreate(BaseModel):
    name: str
    type: str
    node_id: int  
    status: str = "Online"

    @field_validator('node_id', mode='before')
    @classmethod
    def transform_id_to_int(cls, v):
        if isinstance(v, str) and v.isdigit():
            return int(v)
        if v == "" or v is None: # Évite l'erreur si le champ est vide
            raise ValueError("node_id est obligatoire")
        return v

# ============ NOUVEAU : DTO POUR LA MISE À JOUR ============
class SensorUpdate(BaseModel):
    """
    Utilisé pour le PUT /sensors/{id}.
    Rendre les champs optionnels permet de ne mettre à jour que ce qui change.
    """
    name: Optional[str] = None
    type: Optional[str] = None
    node_id: Optional[int] = None
    status: Optional[str] = None

    @field_validator('node_id', mode='before')
    @classmethod
    def transform_id_to_int(cls, v):
        if isinstance(v, str) and v.isdigit():
            return int(v)
        return v

class SensorResponse(BaseModel):
    id: int
    name: str
    type: str
    node_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Version Pydantic V2 de from_attributes
    model_config = ConfigDict(from_attributes=True)
