from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.models.base import Organizacao, Usuario
from app.repositories.organizacoes import OrganizacoesRepo
from app.api.deps import get_current_admin_user

router = APIRouter(prefix="/organizacoes", tags=["organizacoes"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_organization(
    org: Organizacao,
    current_user: Usuario = Depends(get_current_admin_user)
) -> Dict[str, str]:
    """
    Cria uma nova organização. Apenas administradores.
    """
    repo = OrganizacoesRepo()
    
    # Check if exists
    existing = await repo.find_by_cnpj(org.cnpj)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organização com este CNPJ já existe."
        )
        
    org_id = await repo.create_organization(org.model_dump())
    return {"id": org_id, "message": "Organização criada com sucesso"}

@router.get("/", response_model=List[Dict[str, Any]])
async def list_organizations(
    limit: int = 100,
    current_user: Usuario = Depends(get_current_admin_user)
) -> List[Dict[str, Any]]:
    """
    Lista todas as organizações. Apenas administradores.
    """
    repo = OrganizacoesRepo()
    orgs = await repo.list_organizations(limit=limit)
    
    # Convert ObjectId to string for JSON serialization
    for org in orgs:
        org["id"] = str(org.pop("_id"))
        
    return orgs

@router.get("/{org_id}", response_model=Dict[str, Any])
async def get_organization(
    org_id: str,
    current_user: Usuario = Depends(get_current_admin_user)
) -> Dict[str, Any]:
    """
    Obtém detalhes de uma organização. Apenas administradores.
    """
    repo = OrganizacoesRepo()
    org = await repo.get_organization(org_id)
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organização não encontrada"
        )
        
    org["id"] = str(org.pop("_id"))
    return org
