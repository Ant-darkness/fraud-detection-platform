from contextlib import asynccontextmanager
from fastapi import FastAPI

from backend.app.core.seed import seed_initial_admin


@asynccontextmanager
async def lifespan(app: FastAPI):

    # =========================
    # STARTUP LOGIC
    # =========================
    print("SYSTEM STARTING...")

    seed_initial_admin()

    print("INITIALIZATION COMPLETE")

    yield

    # =========================
    # SHUTDOWN LOGIC
    # =========================
    print("SYSTEM SHUTTING DOWN...")
