import os
import httpx
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserResponse, UpdateProfileRequest
from app.models.user import User
from app.models.incident import Workspace, ErrorLog
from app.models.otp import OTPRecord
from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

N8N_REGISTER_WEBHOOK = os.getenv(
    "N8N_REGISTER_WEBHOOK",
    "http://localhost:5678/webhook/register"
)


def to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        role=user.role,
        goal=user.goal,
        company=user.company,
        created_at=user.created_at or datetime.utcnow(),
    )


async def _trigger_n8n_register(email: str, name: str) -> None:
    """Fire-and-forget n8n webhook — never blocks the registration response."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                N8N_REGISTER_WEBHOOK,
                json={"email": email, "name": name},
            )
    except Exception as e:
        print(f"⚠️  [n8n] Register webhook failed: {e}")


@router.post(
    "/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED
)
async def register_user(payload: RegisterRequest):
    existing_user = await User.find_one(User.email == payload.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    hashed_pass = hash_password(payload.password)
    new_user = User(
        email=payload.email,
        password_hash=hashed_pass,
        name=payload.name,
        role=payload.role,
        goal=payload.goal,
        company=payload.company,
    )
    await new_user.insert()

    target_workspace_id = f"workspace-{str(new_user.id)[:8]}"
    existing_workspace  = await Workspace.find_one(
        Workspace.workspace_id == target_workspace_id
    )
    if not existing_workspace:
        new_workspace = Workspace(workspace_id=target_workspace_id)
        await new_workspace.insert()

    access_token = create_access_token(
        user_id=str(new_user.id), email=new_user.email
    )

    await _trigger_n8n_register(email=new_user.email, name=new_user.name)

    return AuthResponse(token=access_token, user=to_user_response(new_user))


@router.post("/login", response_model=AuthResponse)
async def login_user(payload: LoginRequest):
    user = await User.find_one(User.email == payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials.",
        )
    access_token = create_access_token(
        user_id=str(user.id), email=user.email
    )
    return AuthResponse(token=access_token, user=to_user_response(user))


@router.get("/me", response_model=UserResponse)
async def get_authenticated_user(
    current_user: User = Depends(get_current_user),
):
    return to_user_response(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    payload:      UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
):
    """Update name and/or company. Email is not changeable here."""
    if payload.name is not None:
        name = payload.name.strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Name cannot be empty.",
            )
        current_user.name = name

    if payload.company is not None:
        current_user.company = payload.company.strip() or None

    await current_user.save()
    return to_user_response(current_user)


@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_account(current_user: User = Depends(get_current_user)):
    """
    Permanently delete the authenticated user's account.
    Cascade order:
      1. OTP records (by email)
      2. All ErrorLog incidents (by workspace_id)
      3. The Workspace document
      4. The User document
    """
    user_id   = str(current_user.id)
    workspace_id = f"workspace-{user_id[:8]}"

    # 1. Delete OTP records tied to this email
    await OTPRecord.find(OTPRecord.email == current_user.email).delete()

    # 2. Delete all incidents in the user's workspace
    await ErrorLog.find(ErrorLog.workspace_id == workspace_id).delete()

    # 3. Delete the workspace document
    workspace = await Workspace.find_one(Workspace.workspace_id == workspace_id)
    if workspace:
        await workspace.delete()

    # 4. Finally delete the user — must be last so JWT auth still works above
    await current_user.delete()

    return {"message": "Account and all associated data deleted successfully."}