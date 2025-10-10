from fastapi import FastAPI

from .database.db import create_db_and_tables
from .routers import projects, time

app = FastAPI()

app.include_router(projects.router)
app.include_router(time.router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
async def root():
    return {"message": "Hello World"}
