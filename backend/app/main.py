import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import get_settings
from .database import init_db
from .routers import auth, crud, domain, wecom_router
from .seed import seed

settings = get_settings()
app = FastAPI(
    title="山茶智耘 API",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
    openapi_url="/openapi.json" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[item.strip() for item in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    from .database import migrate_db
    migrate_db()
    seed()


os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
app.include_router(auth.router, prefix=settings.api_prefix)
for router in crud.routers:
    app.include_router(router, prefix=settings.api_prefix)
app.include_router(domain.router, prefix=settings.api_prefix)
app.include_router(wecom_router.router, prefix=settings.api_prefix)


@app.get("/")
def root():
    return {"name": settings.app_name, "docs": "/docs", "health": "/health"}


@app.get("/health")
def health():
    return {"status": "ok"}
