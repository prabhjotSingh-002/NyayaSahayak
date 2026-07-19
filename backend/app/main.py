from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.rate_limiter import limiter
from app.routers import documents, cases, chat, drafting

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="NyayaSahayak — AI Legal Companion API"
)

# Rate Limiting Setup
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration for local development and production URLs
_env_origins = [
    o.strip() for o in (settings.ALLOWED_ORIGINS or "").split(",") if o.strip()
]

DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

ALLOW_ORIGINS = list(set(DEFAULT_ORIGINS + _env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to NyayaSahayak API", "version": "1.0.0"}

@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME}

# API Route Registrations
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(cases.router,     prefix=settings.API_V1_STR)
app.include_router(chat.router,      prefix=settings.API_V1_STR)
app.include_router(drafting.router,  prefix=settings.API_V1_STR)
