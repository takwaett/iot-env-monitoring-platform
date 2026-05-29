from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy.future import select
from fastapi import HTTPException, status
from src.modules.sensor.models.sensor_model import SensorModel
from src.modules.node.models.node_model import NodeModel
from src.modules.sensor.dtos.sensor_dto import SensorCreate, SensorUpdate

# 1. RÉCUPÉRER LES CAPTEURS DE L'UTILISATEUR CONNECTÉ
async def get_sensors(db: AsyncSession, user_id: int):
    # Jointure avec NodeModel pour filtrer strictement par user_id
    query = (
        select(SensorModel)
        .join(NodeModel, SensorModel.node_id == NodeModel.id)
        .where(NodeModel.user_id == user_id)
    )
    result = await db.execute(query)
    return result.scalars().all()

# 2. CRÉER UN CAPTEUR (Sécurisé par vérification du propriétaire du nœud)
async def create_sensor(db: AsyncSession, sensors_data: SensorCreate, user_id: int):
    # Sécurité : Vérifier si le node_id cible appartient bien à l'utilisateur connecté
    node_query = select(NodeModel).where(NodeModel.id == sensors_data.node_id, NodeModel.user_id == user_id)
    node_check = await db.execute(node_query)
    if not node_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action interdite : vous ne pouvez pas ajouter de capteur sur un nœud qui ne vous appartient pas."
        )

    db_sensor = SensorModel(**sensors_data.model_dump())
    db.add(db_sensor)
    await db.commit() 
    await db.refresh(db_sensor)
    return db_sensor

# 3. MODIFIER UN CAPTEUR DE L'UTILISATEUR
async def update_sensor(db: AsyncSession, sensor_id: int, sensor_data: SensorUpdate, user_id: int):
    # Jointure de sécurité pour valider la propriété du nœud parent
    query = (
        select(SensorModel)
        .join(NodeModel, SensorModel.node_id == NodeModel.id)
        .where(SensorModel.id == sensor_id, NodeModel.user_id == user_id)
    )
    result = await db.execute(query)
    db_sensor = result.scalar_one_or_none()
    
    if db_sensor:
        # Si l'utilisateur tente de changer le capteur de nœud via le formulaire, on re-vérifie la sécurité
        update_data = sensor_data.model_dump(exclude_unset=True)
        if "node_id" in update_data:
            node_query = select(NodeModel).where(NodeModel.id == update_data["node_id"], NodeModel.user_id == user_id)
            node_check = await db.execute(node_query)
            if not node_check.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Action interdite : le nœud de destination ne vous appartient pas."
                )

        for key, value in update_data.items():
            setattr(db_sensor, key, value)
            
        await db.commit()
        await db.refresh(db_sensor)
        return db_sensor
    return None

# 4. SUPPRIMER UN CAPTEUR DE L'UTILISATEUR
async def delete_sensor(db: AsyncSession, sensor_id: int, user_id: int):
    # Jointure de sécurité pour valider la propriété du nœud parent
    query = (
        select(SensorModel)
        .join(NodeModel, SensorModel.node_id == NodeModel.id)
        .where(SensorModel.id == sensor_id, NodeModel.user_id == user_id)
    )
    result = await db.execute(query)
    db_sensor = result.scalar_one_or_none()
    
    if db_sensor:
        try:
            await db.delete(db_sensor)
            await db.commit()
            return True 
        except Exception as e:
            await db.rollback() 
            raise e 
    return False
