from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from src.modules.node.models.node_model import NodeModel
from src.modules.node.dtos.node_dto import NodeCreate
from fastapi import HTTPException
from sqlalchemy.orm import selectinload



# ajouter noeud

async def create_node(db: AsyncSession, nodes_data: NodeCreate):
   
    db_node = NodeModel(**nodes_data.model_dump())
    db.add(db_node)
    await db.commit()
    await db.refresh(db_node)
    return db_node

#pagination

async def get_all_nodes(db: AsyncSession):
    query = select(NodeModel).options(selectinload(NodeModel.sensors))
    result = await db.execute(query)
    return result.scalars().all()


# modifier noeud 

async def update_node(db: AsyncSession, node_id: int, node_data: NodeCreate):
    query = select(NodeModel).where(NodeModel.id == node_id)
    result = await db.execute(query)
    db_node = result.scalar_one_or_none()
    
    if db_node:
       
        for key, value in node_data.model_dump(exclude_unset=True).items():
            setattr(db_node, key, value)
        await db.commit()
        await db.refresh(db_node)
        return db_node
    return None

#  SUPPRIMER noeud

async def delete_node(db: AsyncSession, node_id: int):
    query = select(NodeModel).where(NodeModel.id == node_id)
    result = await db.execute(query)
    db_node = result.scalar_one_or_none()


    
    if db_node:
        await db.delete(db_node)
        await db.commit()
        return True
    return False
async def get_node_by_id(db: AsyncSession, node_id: int):
    """Récupère un nœud unique par son identifiant."""
    query = (
        select(NodeModel)
        .options(selectinload(NodeModel.sensors)) 
        .filter(NodeModel.id == node_id)
    )
    result = await db.execute(query)
    return result.scalars().first()