from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# =========================================================================
# SCHÉMAS POUR LA CONFIGURATION DES RAPPORTS (report_configs)
# =========================================================================

class DailyConfigDTO(BaseModel):
    """Configuration pour le rapport quotidien"""
    time: str = Field(default="08:00", description="Heure d'envoi au format HH:MM")
    
    class Config:
        json_schema_extra = {
            "example": {"time": "08:00"}
        }


class WeeklyConfigDTO(BaseModel):
    """Configuration pour le rapport hebdomadaire"""
    time: str = Field(default="08:00", description="Heure d'envoi au format HH:MM")
    day: str = Field(default="Lundi", description="Jour d'envoi (Lundi, Mardi, etc.)")
    
    class Config:
        json_schema_extra = {
            "example": {"time": "08:00", "day": "Lundi"}
        }


class ReportConfigResponseDTO(BaseModel):
    """
    DTO utilisé pour renvoyer la configuration actuelle au frontend.
    """
    id: int
    daily_enabled: bool
    weekly_enabled: bool
    recipient_emails: List[str] = []
    daily_config: DailyConfigDTO = Field(default_factory=DailyConfigDTO)
    weekly_config: WeeklyConfigDTO = Field(default_factory=WeeklyConfigDTO)

    class Config:
        from_attributes = True


class ReportConfigUpdateDTO(BaseModel):
    """
    DTO utilisé lorsque le frontend enregistre des modifications.
    """
    daily_enabled: bool = Field(..., description="État du switch pour le rapport quotidien")
    weekly_enabled: bool = Field(..., description="État du switch pour le rapport hebdomadaire")
    recipient_emails: List[EmailStr] = Field(
        default=[], 
        description="Liste complète des e-mails des destinataires"
    )
    daily_config: Optional[DailyConfigDTO] = Field(
        default=None, 
        description="Configuration horaire du rapport quotidien"
    )
    weekly_config: Optional[WeeklyConfigDTO] = Field(
        default=None, 
        description="Configuration horaire du rapport hebdomadaire"
    )


# =========================================================================
# SCHÉMAS POUR L'HISTORIQUE DES ENVOIS (report_history)
# =========================================================================

class ReportHistoryResponseDTO(BaseModel):
    """
    DTO pour alimenter le composant DataGrid React.
    """
    id: int
    type: str = Field(..., description="'daily', 'weekly' ou 'test'")
    period: str = Field(..., description="Période couverte par le rapport")
    date: str = Field(..., description="Date d'envoi formatée")
    recipients: str = Field(..., description="Description des destinataires")
    status: str = Field(..., description="'Envoyé' ou 'Échec'")
    pdf_path: Optional[str] = Field(None, description="Chemin du fichier PDF")
    created_at: Optional[datetime] = Field(None, description="Date de création")

    class Config:
        from_attributes = True


# =========================================================================
# SCHÉMAS POUR LES RAPPORTS MANUELS
# =========================================================================

class TriggerReportDTO(BaseModel):
    """DTO pour déclencher un rapport manuellement"""
    type: str = Field(
        default="daily", 
        description="Type de rapport: 'daily' ou 'weekly'",
        pattern="^(daily|weekly)$"
    )


# =========================================================================
# SCHÉMA DE RÉPONSE API GÉNÉRIQUE
# =========================================================================

class ApiResponseDTO(BaseModel):
    """
    Format standardisé pour toutes les réponses.
    """
    status: str = Field(default="success", description="Statut de la réponse")
    message: Optional[str] = Field(None, description="Message informatif")
    data: Optional[Any] = Field(None, description="Données de réponse")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "message": "Opération réussie",
                "data": None
            }
        }