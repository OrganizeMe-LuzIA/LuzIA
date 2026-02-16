from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from bson import ObjectId
from bson.errors import InvalidId
from app.models.base import Organizacao, Usuario
from app.repositories.organizacoes import OrganizacoesRepo
from app.api.deps import get_current_admin_user
from app.core.database import get_db

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


@router.put("/{org_id}", response_model=Dict[str, str])
async def update_organization(
    org_id: str,
    org: Organizacao,
    current_user: Usuario = Depends(get_current_admin_user),
) -> Dict[str, str]:
    """
    Atualiza dados de uma organização. Apenas administradores.
    """
    _ = current_user
    repo = OrganizacoesRepo()

    current = await repo.get_organization(org_id)
    if not current:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organização não encontrada",
        )

    existing_cnpj = await repo.find_by_cnpj(org.cnpj)
    if existing_cnpj and str(existing_cnpj.get("_id")) != org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organização com este CNPJ já existe.",
        )

    updated = await repo.update_organization(org_id, org.model_dump())
    if not updated:
        return {"id": org_id, "message": "Nenhuma alteração detectada"}

    return {"id": org_id, "message": "Organização atualizada com sucesso"}


@router.delete("/{org_id}", response_model=Dict[str, str])
async def delete_organization(
    org_id: str,
    current_user: Usuario = Depends(get_current_admin_user),
) -> Dict[str, str]:
    """
    Remove uma organização. Apenas administradores.
    Bloqueia remoção se houver setores/usuários vinculados.
    """
    _ = current_user
    repo = OrganizacoesRepo()

    try:
        oid = ObjectId(org_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organização não encontrada",
        )

    db = await get_db()
    setores_vinculados = await db["setores"].count_documents({"idOrganizacao": oid})
    usuarios_vinculados = await db["usuarios"].count_documents({"idOrganizacao": oid})

    if setores_vinculados > 0 or usuarios_vinculados > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Não é possível excluir a organização: existem vínculos ativos "
                f"(setores={setores_vinculados}, usuarios={usuarios_vinculados})."
            ),
        )

    deleted = await repo.delete_organization(org_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organização não encontrada",
        )

    return {"id": org_id, "message": "Organização excluída com sucesso"}
