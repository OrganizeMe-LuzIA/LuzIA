from typing import Annotated
from fastapi import Depends, HTTPException, status
from app.auth import get_current_user as get_token_user, TokenData
from app.models.base import Usuario, StatusEnum
from app.repositories.usuarios import UsuariosRepo

async def get_current_user(
    token_data: Annotated[TokenData, Depends(get_token_user)],
) -> Usuario:
    """
    Dependency to get the current authenticated user from the database.
    """
    user_repo = UsuariosRepo()
    user_dict = await user_repo.find_by_phone(token_data.phone)
    if user_dict is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return Usuario(**user_dict)

async def get_current_active_user(
    current_user: Annotated[Usuario, Depends(get_current_user)],
) -> Usuario:
    """
    Dependency to ensure the user is active.
    """
    if current_user.status != StatusEnum.ATIVO and current_user.status != "ativo":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return current_user

async def get_current_admin_user(
    current_user: Annotated[Usuario, Depends(get_current_active_user)],
) -> Usuario:
    """
    Dependency to ensure the user is an admin.
    Mock implementation: Admin if (no idOrganizacao AND no idSetor) OR specific metadata flag.
    Adjust this logic as needed for the specific administrative model.
    """
    is_admin = False
    
    # Check 1: Explicit flag in metadata
    if current_user.metadata and current_user.metadata.get("is_admin") is True:
        is_admin = True
        
    # Check 2: Loose check - if not bound to org/setor (Super Admin?)
    # This might be risky depending on how users are created, but assuming admins are special.
    # For now, let's rely on metadata or specific phones if needed.
    
    # Temporary: Allow if explicitly flagged.
    if not is_admin:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges",
        )
    return current_user
