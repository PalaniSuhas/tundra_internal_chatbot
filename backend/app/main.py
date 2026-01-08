from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import Database
from app.routes import auth_routes, chat_routes, file_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    await Database.connect_db()
    yield
    await Database.close_db()


app = FastAPI(
    title="Professional Chat Application",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(chat_routes.router)
app.include_router(file_routes.router)


@app.get("/")
async def root():
    return {"message": "Professional Chat Application API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}