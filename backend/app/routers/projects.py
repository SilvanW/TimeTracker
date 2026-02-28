from typing import Optional

from fastapi import APIRouter
from sqlmodel import select

from app.database.db import SessionDep
from app.database.project import CreateProject, Project
from app.database.project_time import CreateProjectTime, ProjectTime

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/")
def read_projects(session: SessionDep) -> list:
    projects = session.exec(select(Project).order_by(Project.id)).all()
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


# Project Time
@router.get("/{project_id}/time")
def get_project_time(
    project_id: int, session: SessionDep, year: Optional[int] = None
) -> list[ProjectTime]:
    query = select(ProjectTime).where(ProjectTime.project_id == project_id)

    if year is not None:
        query = query.where(ProjectTime.year == year)

    query.order_by(ProjectTime.year.desc())

    result = session.exec(query).all()
    return result


@router.post("/{project_id}/time")
def create_project_time(
    project_id: int, project_time: CreateProjectTime, session: SessionDep
) -> ProjectTime:
    db_project_time = ProjectTime(project_id=project_id, **project_time.model_dump())
    db_project_time.project_id = project_id
    session.add(db_project_time)
    session.commit()
    session.refresh(db_project_time)
    return db_project_time
