"""
CreditIn FastAPI Main Application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import personas, health_score, simulate, optimizer, improve

app = FastAPI(title="CreditIn API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api and direct
app.include_router(personas.router, prefix="/api")
app.include_router(health_score.router, prefix="/api")
app.include_router(simulate.router, prefix="/api")
app.include_router(optimizer.router, prefix="/api")
app.include_router(improve.router)


@app.get("/healthz")
def healthz():
    return {"status": "ok", "env": settings.ENV}


@app.get("/api/health")
def api_health():
    from sqlalchemy import text
    from app.db import engine
    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        db_ok = False

    llm_ok = bool(settings.LLM_API_KEY)
    return {
        "status": "ok",
        "db": db_ok,
        "llm_configured": llm_ok,
    }
