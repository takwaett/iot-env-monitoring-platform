from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from src.modules.node.models.node_model import NodeModel
from src.modules.node.dtos.node_dto import NodeCreate
from fastapi import HTTPException

# 1. AJOUTER UN NŒUD (Lié automatiquement à l'utilisateur connecté)
async def create_node(db: AsyncSession, nodes_data: NodeCreate, user_id: int):
    # Injection automatique du user_id de l'utilisateur connecté
    db_node = NodeModel(**nodes_data.model_dump(), user_id=user_id)
    db.add(db_node)
    await db.commit()
    await db.refresh(db_node, ["sensors"]) 
    return db_node

# 2. RÉCUPÉRER TOUS LES NŒUDS (Uniquement ceux de l'utilisateur connecté)
async def get_all_nodes(db: AsyncSession, user_id: int):
    # Filtrage strict par user_id
    query = (
        select(NodeModel)
        .where(NodeModel.user_id == user_id)
        .options(selectinload(NodeModel.sensors))
    )
    result = await db.execute(query)
    return result.scalars().all()

# 3. MODIFIER UN NŒUD (Sécurisé par identifiant utilisateur)
async def update_node(db: AsyncSession, node_id: int, node_data: NodeCreate, user_id: int):
    # L'utilisateur doit posséder le nœud pour avoir le droit de le modifier
    query = (
        select(NodeModel)
        .where(NodeModel.id == node_id, NodeModel.user_id == user_id)
        .options(selectinload(NodeModel.sensors))
    )
    result = await db.execute(query)
    db_node = result.scalar_one_or_none()
    
    if db_node:
        for key, value in node_data.model_dump(exclude_unset=True).items():
            setattr(db_node, key, value)
        await db.commit()
        await db.refresh(db_node, ["sensors"])
        return db_node
    return None

# 4. SUPPRIMER UN NŒUD (Sécurisé par identifiant utilisateur)
async def delete_node(db: AsyncSession, node_id: int, user_id: int):
    # L'utilisateur doit posséder le nœud pour avoir le droit de le supprimer
    query = select(NodeModel).where(NodeModel.id == node_id, NodeModel.user_id == user_id)
    result = await db.execute(query)
    db_node = result.scalar_one_or_none()
    
    if db_node:
        await db.delete(db_node)
        await db.commit()
        return True
    return False

# 5. RÉCUPÉRER UN NŒUD PAR ID (Sécurisé par identifiant utilisateur)
async def get_node_by_id(db: AsyncSession, node_id: int, user_id: int):
    """Récupère un nœud unique s'il appartient à l'utilisateur connecté."""
    query = (
        select(NodeModel)
        .where(NodeModel.id == node_id, NodeModel.user_id == user_id)
        .options(selectinload(NodeModel.sensors)) 
    )
    result = await db.execute(query)
    return result.scalars().first()
