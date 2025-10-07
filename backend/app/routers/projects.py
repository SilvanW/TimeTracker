from fastapi import APIRouter
from sqlmodel import select

from app.database.db import SessionDep, Project, CreateProject

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/")
def read_projects(session: SessionDep):
    projects = session.exec(select(Project)).all()
    return projects


@router.post("/")
def create_project(project: CreateProject, session: SessionDep):
    db_project = Project(**project.model_dump())
    session.add(db_project)
    session.commit()
    session.refresh(db_project)
    return db_project
