from fastapi import APIRouter
from backend.app.api.endpoints import predict, report

api_router = APIRouter()

# Include endpoints
api_router.include_router(predict.router, tags=["prediction"])
api_router.include_router(report.router, tags=["report"])
