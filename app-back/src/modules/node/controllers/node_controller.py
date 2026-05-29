from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.modules.node.services import node_services 
from src.modules.node.dtos.node_dto import NodeCreate, NodeResponse
from src.utils.database import get_db
from src.utils.dependencies import get_current_user
from src.modules.auth.models.user_model import UserModel

router = APIRouter(prefix="/nodes", tags=["Nodes"])

# 1. RÉCUPÉRER LES NŒUDS DE L'UTILISATEUR CONNECTÉ (GET)
@router.get("/", response_model=List[NodeResponse])
async def get_all_nodes(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Récupère uniquement la liste des nœuds appartenant à l'utilisateur connecté."""
    return await node_services.get_all_nodes(db, user_id=current_user.id)


# 2. RÉCUPÉRER UN SEUL NŒUD PAR SON ID SI APPARTIENT À L'UTILISATEUR (GET)
@router.get("/{node_id}", response_model=NodeResponse)
async def get_node_by_id(
    node_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Récupère un nœud spécifique s'il appartient à l'utilisateur connecté."""
    node = await node_services.get_node_by_id(db, node_id, user_id=current_user.id)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Nœud introuvable ou accès non autorisé."
        )
    return node
 
 
# 3. AJOUTER UN NŒUD LIÉ À L'UTILISATEUR (POST)
@router.post("/", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
async def add_node(
    node: NodeCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    """Crée un nœud lié automatiquement à l'utilisateur connecté."""
    return await node_services.create_node(db, node, user_id=current_user.id)


# 4. MODIFIER UN NŒUD S'IL APPARTIENT À L'UTILISATEUR (PUT)
@router.put("/{node_id}", response_model=NodeResponse)
async def update_node(
    node_id: int, 
    node_data: NodeCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Modifie un nœud existant uniquement si l'utilisateur en est le propriétaire."""
    updated_node = await node_services.update_node(db, node_id, node_data, user_id=current_user.id)
    if not updated_node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Nœud introuvable ou accès non autorisé."
        )
    return updated_node


# 5. SUPPRIMER UN NŒUD S'IL APPARTIENT À L'UTILISATEUR (DELETE)
@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(
    node_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Supprime un nœud existant uniquement si l'utilisateur en est le propriétaire."""
    success = await node_services.delete_node(db, node_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Nœud introuvable ou accès non autorisé."
        )
    return None
