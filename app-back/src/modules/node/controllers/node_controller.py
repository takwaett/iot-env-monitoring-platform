from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.modules.node.services import node_services # Vérifie si c'est node_services ou node_service
from src.modules.node.dtos.node_dto import NodeCreate, NodeResponse
from src.utils.database import get_db
from src.utils.dependencies import get_current_user

router = APIRouter(prefix="/nodes", tags=["Nodes"])

# 1. RÉCUPÉRER TOUS LES NŒUDS (GET)
# On enlève Depends(get_current_user) pour que le front charge les noms au démarrage
@router.get("/", response_model=List[NodeResponse])
async def get_all_nodes(db: AsyncSession = Depends(get_db)):
    """Récupère la liste de tous les nœuds pour le mapping des noms dans le front."""
    return await node_services.get_all_nodes(db)


# 5. RÉCUPÉRER UN SEUL NŒUD PAR SON ID (GET)
@router.get("/{node_id}", response_model=NodeResponse)
async def get_node_by_id(
    node_id: int, 
    db: AsyncSession = Depends(get_db)
):
    """Récupère un nœud spécifique par son ID."""
    node = await node_services.get_node_by_id(db, node_id) # Assurez-vous que cette méthode existe dans node_services
    if not node:
        raise HTTPException(status_code=404, detail="Nœud non trouvé")
    return node
 
 
# 2. AJOUTER UN NŒUD (POST)
@router.post("/", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
async def add_node(
    node: NodeCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: str = Depends(get_current_user)
):
    return await node_services.create_node(db, node)

# 3. MODIFIER UN NŒUD (PUT)
@router.put("/{node_id}", response_model=NodeResponse)
async def update_node(
    node_id: int, 
    node_data: NodeCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    updated_node = await node_services.update_node(db, node_id, node_data)
    if not updated_node:
        raise HTTPException(status_code=404, detail="Nœud non trouvé")
    return updated_node

# 4. SUPPRIMER UN NŒUD (DELETE)
@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(
    node_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    success = await node_services.delete_node(db, node_id)
    if not success:
        raise HTTPException(status_code=404, detail="Nœud non trouvé")
    return None
