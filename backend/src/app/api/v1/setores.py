from typing import Dict, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator

from app.api.deps import get_current_admin_user
from app.core.database import get_db
from app.models.base import Setor, Usuario
from app.repositories.organizacoes import OrganizacoesRepo
from app.repositories.setores import SetoresRepo

router = APIRouter(prefix="/setores", tags=["setores"])


class SetorUpdateRequest(BaseModel):
    idOrganizacao: str
    nome: str
    descricao: Optional[str] = None

    @field_validator("idOrganizacao")
    @classmethod
    def validate_org_id(cls, value: str) -> str:
        if not (value or "").strip():
            raise ValueError("idOrganizacao é obrigatório")
        return value.strip()

    @field_validator("nome")
    @classmethod
    def validate_nome(cls, value: str) -> str:
        nome = (value or "").strip()
        if not nome:
            raise ValueError("nome é obrigatório")
        return nome


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_sector(
    setor: Setor,
    current_user: Usuario = Depends(get_current_admin_user),
) -> Dict[str, str]:
    """
    Cria um novo setor para uma organização existente. Apenas administradores.
    """
    _ = current_user

    org_repo = OrganizacoesRepo()
    setores_repo = SetoresRepo()

    # Garante que a organização exista antes de criar o setor.
    org = await org_repo.get_organization(str(setor.idOrganizacao))
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organização não encontrada.",
        )

    existing = await setores_repo.find_by_name_and_org(setor.nome, str(setor.idOrganizacao))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um setor com esse nome nesta organização.",
        )

    setor_id = await setores_repo.create_sector(setor.model_dump())
    return {"id": setor_id, "message": "Setor criado com sucesso"}


@router.put("/{setor_id}", response_model=Dict[str, str])
async def update_sector(
    setor_id: str,
    payload: SetorUpdateRequest,
    current_user: Usuario = Depends(get_current_admin_user),
) -> Dict[str, str]:
    """
    Atualiza dados de um setor. Apenas administradores.
    """
    _ = current_user

    org_repo = OrganizacoesRepo()
    setores_repo = SetoresRepo()

    current = await setores_repo.get_sector(setor_id)
    if not current:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Setor não encontrado.",
        )

    org = await org_repo.get_organization(payload.idOrganizacao)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organização não encontrada.",
        )

    existing = await setores_repo.find_by_name_and_org(payload.nome, payload.idOrganizacao)
    if existing and str(existing.get("_id")) != setor_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um setor com esse nome nesta organização.",
        )

    updated = await setores_repo.update_sector(
        setor_id,
        {
            "idOrganizacao": payload.idOrganizacao,
            "nome": payload.nome,
            "descricao": payload.descricao,
        },
    )
    if not updated:
        return {"id": setor_id, "message": "Nenhuma alteração detectada"}

    return {"id": setor_id, "message": "Setor atualizado com sucesso"}


@router.delete("/{setor_id}", response_model=Dict[str, str])
async def delete_sector(
    setor_id: str,
    current_user: Usuario = Depends(get_current_admin_user),
) -> Dict[str, str]:
    """
    Remove um setor. Apenas administradores.
    Bloqueia remoção se houver usuários vinculados ao setor.
    """
    _ = current_user
    setores_repo = SetoresRepo()

    try:
        sid = ObjectId(setor_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Setor não encontrado.",
        )

    db = await get_db()
    usuarios_vinculados = await db["usuarios"].count_documents({"idSetor": sid})
    if usuarios_vinculados > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível excluir o setor: existem {usuarios_vinculados} usuários vinculados.",
        )

    deleted = await setores_repo.delete_sector(setor_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Setor não encontrado.",
        )

    return {"id": setor_id, "message": "Setor excluído com sucesso"}
