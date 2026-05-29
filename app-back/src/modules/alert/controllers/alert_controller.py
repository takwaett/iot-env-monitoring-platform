from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.modules.alert.services.alert_service import alert_service 
from src.modules.alert.dtos.alert_dto import AlertCreate, AlertResponse
from src.utils.database import get_db
from src.utils.dependencies import get_current_user
from src.modules.auth.models.user_model import UserModel

router = APIRouter(prefix="/alerts", tags=["Alerts"])

# 1. RÉCUPÉRER LES ALERTES DANGER DE L'UTILISATEUR CONNECTÉ (GET)
@router.get("/danger", response_model=List[AlertResponse])
async def get_danger_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Récupère les alertes de type danger spécifiques à l'utilisateur connecté."""
    return await alert_service.get_danger_alerts(db, user_id=current_user.id)

# 2. RÉCUPÉRER TOUTES LES ALERTES DE L'UTILISATEUR CONNECTÉ (GET)
@router.get("/", response_model=List[AlertResponse])
async def get_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Récupère l'historique complet des alertes de l'utilisateur connecté."""
    return await alert_service.get_all_alerts(db, user_id=current_user.id)

# 3. CRÉATION (POST)
@router.post("/", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def add_alert(
    alert: AlertCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    try:
        # Note : Généralement les alertes sont générées via le MeasurementService,
        # si vous l'exposez ici, assurez-vous que la méthode create_alert existe dans votre service.
        return await alert_service.create_alert(db, alert)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 4. MODIFICATION SÉCURISÉE (PUT)
@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    alert_data: AlertCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Modifie une alerte si elle appartient à l'utilisateur connecté."""
    updated_alert = await alert_service.update_alert(db, alert_id, alert_data, user_id=current_user.id)
    if not updated_alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Alerte introuvable ou accès non autorisé."
        )
    return updated_alert

# 5. SUPPRESSION SÉCURISÉE (DELETE)
@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Supprime une alerte si elle appartient à l'utilisateur connecté."""
    success = await alert_service.delete_alert(db, alert_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Alerte introuvable ou accès non autorisé."
        )
    return None
