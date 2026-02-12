from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.db import create_db_and_tables
from .routers import projects, time
from .routers import analytics

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(time.router)
app.include_router(analytics.router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
async def root():
    return {"message": "Hello World"}
