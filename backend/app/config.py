from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "NyayaSahayak"
    API_V1_STR: str = "/api/v1"
    # Comma-separated list of production frontend URLs for CORS
    # e.g. "https://nyayasahayak.vercel.app,https://nyayasahayak.app"
    ALLOWED_ORIGINS: str = ""
    
    # Supabase (Database & Auth)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    
    # AI Providers
    OPENROUTER_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    
    # Embedding Configuration
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-2"
    
    # Development Mode (NEVER set this to True in production/Render)
    DEV_MODE: bool = False
    DEV_FALLBACK_USER_ID: str = "97edeeb5-3a17-4678-b105-e329620e809e"

    # Rate Limiting
    RATE_LIMIT_PER_USER_PER_MINUTE: int = 10
    RATE_LIMIT_PER_USER_PER_DAY: int = 200
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
