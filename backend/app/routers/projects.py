from typing import Any, Optional

from fastapi import APIRouter
from sqlmodel import select

from app.database.db import SessionDep
from app.database.project import CreateProject, Project
from app.database.project_budget import CreateProjectBudget, ProjectBudget

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


# Project Budget
@router.get("/budgets")
def read_project_budgets(session: SessionDep) -> list[ProjectBudget]:
    budgets = session.exec(
        select(ProjectBudget).order_by(
            ProjectBudget.project_id, ProjectBudget.year.desc()
        )
    ).all()
    return budgets


@router.get("/{project_id}/budget")
def get_project_budget(
    project_id: int, session: SessionDep, year: Optional[int] = None
) -> list[ProjectBudget]:
    query = select(ProjectBudget).where(ProjectBudget.project_id == project_id)

    if year is not None:
        query = query.where(ProjectBudget.year == year)

    query = query.order_by(ProjectBudget.year.desc())

    result = session.exec(query).all()
    return result


@router.post("/{project_id}/budget")
def create_project_budget(
    project_id: int, project_budget: CreateProjectBudget, session: SessionDep
) -> Any:
    # Any: returns the budget, or an error dict (200 + {"error": ...}
    # convention used across this API).
    if session.get(Project, project_id) is None:
        return {"error": "Project not found"}

    existing = session.exec(
        select(ProjectBudget).where(
            ProjectBudget.project_id == project_id,
            ProjectBudget.year == project_budget.year,
        )
    ).first()
    if existing:
        return {"error": "Budget already exists for this project and year"}

    db_project_budget = ProjectBudget(
        project_id=project_id, **project_budget.model_dump()
    )
    db_project_budget.project_id = project_id
    session.add(db_project_budget)
    session.commit()
    session.refresh(db_project_budget)
    return db_project_budget


@router.delete("/{project_id}/budget/{budget_id}")
def delete_project_budget(project_id: int, budget_id: int, session: SessionDep) -> dict:
    db_project_budget = session.get(ProjectBudget, budget_id)

    if not db_project_budget or db_project_budget.project_id != project_id:
        return {"error": "Project budget not found"}

    session.delete(db_project_budget)
    session.commit()
    return {"message": "Project budget deleted successfully"}
