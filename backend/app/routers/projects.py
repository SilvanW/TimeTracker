from fastapi import APIRouter
from sqlmodel import select

from app.database.db import SessionDep
from app.database.project import CreateProject, Project

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/")
def read_projects(session: SessionDep) -> list:
    projects = session.exec(select(Project)).all()
    return projects


@router.post("/")
def create_project(project: CreateProject, session: SessionDep) -> Project:
    db_project = Project(**project.model_dump())
    session.add(db_project)
    session.commit()
    session.refresh(db_project)
    return db_project


@router.put("/{project_id}")
def update_project(
    project_id: int, project: CreateProject, session: SessionDep
) -> Project:
    db_project = session.get(Project, project_id)

    if not db_project:
        return {"error": "Project not found"}

    for key, value in project.model_dump().items():
        setattr(db_project, key, value)

    session.add(db_project)
    session.commit()
    session.refresh(db_project)
    return db_project


@router.delete("/{project_id}")
def delete_project(project_id: int, session: SessionDep) -> dict:
    project = session.get(Project, project_id)

    if not project:
        return {"error": "Project not found"}

    session.delete(project)
    session.commit()
    return {"message": "Project deleted successfully"}
