from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from pathlib import Path
import os
import logging

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.database import init_db, close_db
from app.routes import auth, stylists, bookings, payments, ratings, messages, notifications, availability, portfolio, concierge, favorites, admin, stylist_features, quick_rebook, passkeys, chat, loyalty, cancellation, analytics, search, review_photos, payouts, feedback, credentials, tickets, coupons
from app.services.reminder_scheduler import start_scheduler, stop_scheduler

limiter = Limiter(key_func=get_remote_address)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    start_scheduler()
    logger.info("Onda API startup complete")
    yield
    stop_scheduler()
    await close_db()
    logger.info("Onda API shutdown complete")

app = FastAPI(title="Onda API", version="2.1.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(stylists.router)
api_router.include_router(bookings.router)
api_router.include_router(payments.router)
api_router.include_router(ratings.router)
api_router.include_router(messages.router)
api_router.include_router(notifications.router)
api_router.include_router(availability.router)
api_router.include_router(portfolio.router)
api_router.include_router(concierge.router)
api_router.include_router(favorites.router)
api_router.include_router(admin.router)
api_router.include_router(stylist_features.router)
api_router.include_router(quick_rebook.router)
api_router.include_router(passkeys.router)

api_router.include_router(chat.router)
api_router.include_router(loyalty.router)
api_router.include_router(cancellation.router)
api_router.include_router(analytics.router)
api_router.include_router(search.router)
api_router.include_router(review_photos.router)
api_router.include_router(payouts.router)
api_router.include_router(feedback.router)
api_router.include_router(credentials.router)
api_router.include_router(tickets.router)
api_router.include_router(coupons.router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check if frontend build exists for production mode
FRONTEND_BUILD_DIR = Path(__file__).parent.parent / "frontend" / "build"
IS_PRODUCTION = FRONTEND_BUILD_DIR.exists()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0", "app": "Onda", "mode": "production" if IS_PRODUCTION else "development"}

# Serve frontend static files in production
if IS_PRODUCTION:
    app.mount("/static", StaticFiles(directory=FRONTEND_BUILD_DIR / "static"), name="static")
    
    @app.get("/")
    async def serve_root():
        return FileResponse(FRONTEND_BUILD_DIR / "index.html")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Let API routes be handled by FastAPI routers (they won't reach here due to /api prefix)
        file_path = FRONTEND_BUILD_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        # SPA fallback - return index.html for client-side routing
        return FileResponse(FRONTEND_BUILD_DIR / "index.html")
else:
    @app.get("/")
    async def root():
        return {"message": "Onda API v2.0 is running"}
