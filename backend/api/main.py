from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes.health_routes import router as health_router
from backend.api.routes.prediction_routes import router as prediction_router
from backend.api.routes.review_routes import router as review_router
from backend.api.routes.dashboard_routes import router as dashboard_router
from backend.api.routes.model_routes import router as model_router
from backend.api.routes.officer_routes import router as officer_router
from backend.api.routes.auth_routes import router as auth_router
from backend.api.routes.notification_routes import router as notification_router
from backend.api.routes.transaction_routes import router as transaction_router
from backend.api.routes.metric_routes import router as metric_router

from backend.app.core.lifespan import lifespan


app = FastAPI(title="Fraud Detection API",
              lifespan=lifespan)

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # Ruhusu frontend hii
    allow_credentials=True,
    allow_methods=["*"],         # GET, POST, PUT, DELETE, OPTIONS n.k.
    allow_headers=["*"],         # Ruhusu headers zote
)

app.include_router(health_router)

app.include_router(prediction_router)

app.include_router(review_router)

app.include_router(dashboard_router)

app.include_router(model_router)

app.include_router(metric_router)

app.include_router(officer_router)

app.include_router(auth_router)

app.include_router(transaction_router)

app.include_router(notification_router)

#@app.on_event("startup")
#def startup():
#    from ml.inference.predictor import predictor.reload_model()
