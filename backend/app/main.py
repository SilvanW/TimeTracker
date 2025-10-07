from fastapi import FastAPI

from .routers import projects
from .database.db import create_db_and_tables

app = FastAPI()

app.include_router(projects.router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
async def root():
    return {"message": "Hello World"}
