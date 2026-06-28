from fastapi import FastAPI

from backend.api.routes.health_routes import router as health_router
from backend.api.routes.prediction_routes import router as prediction_router
from backend.api.routes.review_routes import router as review_router
from backend.api.routes.dashboard_routes import router as dashboard_router
from backend.api.routes.model_routes import router as model_router
from backend.api.routes.officer_routes import router as officer_router
from backend.api.routes.auth_routes import router as auth_router



app = FastAPI(title="Fraud Detection API")

app.include_router(health_router)

app.include_router(prediction_router)

app.include_router(review_router)

app.include_router(dashboard_router)

app.include_router(model_router)

app.include_router(officer_router)

app.include_router(auth_router)
