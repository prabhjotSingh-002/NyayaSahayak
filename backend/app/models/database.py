from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client
def get_supabase_client() -> Client:
    # Use service role key to allow the backend bypass RLS for automated operations
    supabase_url: str = settings.SUPABASE_URL
    supabase_key: str = settings.SUPABASE_SERVICE_ROLE_KEY
    
    if not supabase_url or not supabase_key:
        print("WARNING: Supabase credentials not set.")
        pass
        
    return create_client(supabase_url, supabase_key)

supabase = get_supabase_client()
