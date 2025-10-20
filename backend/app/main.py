from fastapi import FastAPI

from .database.db import create_db_and_tables
from .routers import projects, time
from .routers import analytics

app = FastAPI()

app.include_router(projects.router)
app.include_router(time.router)
app.include_router(analytics.router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
async def root():
    return {"message": "Hello World"}
