from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from app.models.database import supabase

security = HTTPBearer()

async def verify_supabase_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verifies the Supabase JWT token and returns auth user ID."""
    token = credentials.credentials

    # DEV_MODE token bypass for local environment testing
    if settings.DEV_MODE and token in ("mock_token", "mock", ""):
        print(f"[Auth] DEV_MODE bypass: returning fallback user ID.")
        return settings.DEV_FALLBACK_USER_ID

    # Production JWT validation
    try:
        user_resp = supabase.auth.get_user(token)
        if not user_resp or not user_resp.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_resp.user.id
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Auth] Token verification error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(user_id: str = Depends(verify_supabase_token)) -> str:
    return user_id

async def get_current_user_uuid(supabase_auth_id: str = Depends(verify_supabase_token)) -> str:
    """Resolves Supabase auth.users.id to public.users.id (UUID)."""
    try:
        res = supabase.table("users").select("id").eq("supabase_auth_id", supabase_auth_id).execute()
        if res.data:
            return res.data[0]["id"]
    except Exception as e:
        print(f"Warning: Failed to fetch user matching supabase_auth_id: {e}")

    # Fallback auto-registration of user row
    try:
        email = f"{supabase_auth_id}@nyayasahayak.dev"
        insert_res = supabase.table("users").insert({
            "supabase_auth_id": supabase_auth_id,
            "email": email,
            "name": "User",
        }).execute()
        if insert_res.data:
            uuid = insert_res.data[0]["id"]
            print(f"INFO: Auto-created user row for supabase_auth_id={supabase_auth_id}, uuid={uuid}")
            return uuid
    except Exception as e:
        print(f"WARNING: User insert attempt failed ({e}), retrying select...")
        try:
            res = supabase.table("users").select("id").eq("supabase_auth_id", supabase_auth_id).execute()
            if res.data:
                return res.data[0]["id"]
        except Exception as e2:
            print(f"ERROR: Could not resolve user UUID: {e2}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not resolve user identity. Please sign out and sign back in.",
    )
