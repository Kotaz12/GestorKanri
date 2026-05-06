"""Gestor Kanri — FastAPI server entry."""
import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

import db
from routers import auth as auth_router
from routers import clients as clients_router
from routers import catalogs as catalogs_router
from routers import procedures as procedures_router
from routers import notifications as notifications_router
from routers import init_data as init_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("kanri")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await db.init_pool()
        logger.info("PostgreSQL pool initialized")
    except Exception as e:
        logger.error(f"Failed to init DB pool: {e}")
    yield
    await db.close_pool()


app = FastAPI(title="Gestor Kanri API", lifespan=lifespan)

api = APIRouter()


@api.get("/")
async def root():
    return {"service": "Gestor Kanri", "status": "ok"}


@api.get("/health")
async def health():
    try:
        v = await db.fetchval("SELECT 1")
        return {"status": "ok", "db": v == 1}
    except Exception as e:
        return {"status": "ok", "db": False, "error": str(e)[:100]}


api.include_router(auth_router.router)
api.include_router(clients_router.router)
api.include_router(catalogs_router.router)
api.include_router(procedures_router.router)
api.include_router(notifications_router.router)
api.include_router(init_router.router)

app.include_router(api, prefix="/api")

# CORS — allow credentials; allow any preview origin.
origins_env = os.environ.get("CORS_ORIGINS", "*").strip()
if origins_env == "*":
    # With allow_credentials we cannot use "*"; use regex to allow all origins safely.
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in origins_env.split(",") if o.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
