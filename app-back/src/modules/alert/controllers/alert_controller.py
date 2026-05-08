from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.modules.alert.services.alert_service import alert_service 
from src.modules.alert.dtos.alert_dto import AlertCreate, AlertResponse
from src.utils.database import get_db
from src.utils.dependencies import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])

# route pour dashboard
@router.get("/danger", response_model=List[AlertResponse])
async def get_danger_alerts(
    db: AsyncSession = Depends(get_db)
):
    """Récupère les alertes pour alimenter la courbe et la liste du dashboard."""
    return await alert_service.get_danger_alerts(db)

# récupération de toutes les alertes
@router.get("/", response_model=List[AlertResponse])
async def get_alerts(db: AsyncSession = Depends(get_db)):
    return await alert_service.get_all_alerts(db)

# création
@router.post("/", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def add_alert(
    alert: AlertCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    try:
        return await alert_service.create_alert(db, alert)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# modification
@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    alert_data: AlertCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    updated_alert = await alert_service.update_alert(db, alert_id, alert_data)
    if not updated_alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    return updated_alert

# la suppression
@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    success = await alert_service.delete_alert(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alerte introuvable")
    return None
