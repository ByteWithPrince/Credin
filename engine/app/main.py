"""
CreditIn FastAPI Engine
All financial calculation is deterministic and covered by tests.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import personas, simulate, optimize, users, improve

app = FastAPI(
    title="CreditIn Engine API",
    description="Financial What-If Simulator & Health Score Engine",
    version="2.0.0"
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(personas.router)
app.include_router(simulate.router)
app.include_router(optimize.router)
app.include_router(users.router)
app.include_router(improve.router)


@app.get("/")
def read_root():
    return {
        "app": "CreditIn API",
        "status": "online",
        "version": "2.0.0"
    }


@app.get("/healthz")
def health_check():
    return {"status": "ok", "env": "dev"}
