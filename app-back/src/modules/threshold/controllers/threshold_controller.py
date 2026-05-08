from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from src.modules.threshold.dtos.threshold_dto import ThresholdCreate, ThresholdResponse
from src.modules.threshold.models.threshold_model import ThresholdModel
# Import des fonctions du service pour garder la logique métier centralisée
from src.modules.threshold.services.threshold_service import create_threshold 
from src.utils.database import get_db
from src.utils.dependencies import get_current_user 

router = APIRouter(prefix="/thresholds", tags=["Thresholds"])

@router.get("/", response_model=List[ThresholdResponse])
async def get_thresholds(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(ThresholdModel))
    return result.scalars().all()

@router.post("/", response_model=ThresholdResponse, status_code=status.HTTP_201_CREATED)
async def add_threshold(threshold: ThresholdCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    # 1. Vérification des doublons (MISE À JOUR AVEC LES NOUVELLES COLONNES)
    # On vérifie si un seuil existe déjà pour ce Nœud, ce Capteur ET ce Type de mesure
    query = select(ThresholdModel).where(
        ThresholdModel.node_id == threshold.node_id,
        ThresholdModel.sensor_id == threshold.sensor_id,
        ThresholdModel.type == threshold.type
    )
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Un seuil existe déjà pour ce capteur sur ce nœud"
        )

    # 2. Création via le modèle
    try:
        db_threshold = ThresholdModel(**threshold.model_dump())
        db.add(db_threshold)
        await db.commit()
        await db.refresh(db_threshold)
        return db_threshold
    except Exception as e:
        await db.rollback()
        print(f"❌ Erreur lors de l'ajout du seuil : {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'enregistrement en base de données"
        )

@router.put("/{threshold_id}", response_model=ThresholdResponse)
async def update_threshold(threshold_id: int, threshold: ThresholdCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(ThresholdModel).where(ThresholdModel.id == threshold_id))
    db_threshold = result.scalars().first()
    
    if not db_threshold:
        raise HTTPException(status_code=404, detail="Seuil non trouvé")
        
    # Mise à jour simplifiée
    update_data = threshold.model_dump()
    for key, value in update_data.items():
        setattr(db_threshold, key, value)
    
    await db.commit()
    await db.refresh(db_threshold)
    return db_threshold

@router.delete("/{threshold_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_threshold(threshold_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(select(ThresholdModel).where(ThresholdModel.id == threshold_id))
    db_threshold = result.scalars().first()
    
    if not db_threshold:
        raise HTTPException(status_code=404, detail="Seuil non trouvé")
        
    await db.delete(db_threshold)
    await db.commit()
    return None
