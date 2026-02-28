from enum import Enum
from typing import Optional
from fastapi import APIRouter
from sqlmodel import desc, select, func

from app.database.db import SessionDep
from app.database.time import CreateTime, KWTime, Time, ProjectTime, DOYTime
from app.database.project import Project

router = APIRouter(prefix="/time", tags=["time"])


@router.get("/")
def read_time(session: SessionDep, year: Optional[int] = None) -> list[Time]:
    query = select(Time)

    if year is not None:
        query = query.where(func.extract("year", Time.start) == year)

    time = session.exec(query).all()
    return time


@router.get("/calendar_week")
def get_time_by_calendar_week(
    session: SessionDep, year: Optional[int] = None
) -> list[KWTime]:
    query = (
        select(
            func.extract("year", Time.start).label("year"),
            func.extract("week", Time.start).label("calendar_week"),
            func.sum(func.extract("epoch", Time.end - Time.start) / 3600.0).label(
                "total_time"
            ),
        )
        .group_by(func.extract("year", Time.start), func.extract("week", Time.start))
        .order_by(
            desc(func.extract("year", Time.start)),
            desc(func.extract("week", Time.start)),
        )
    )

    if year is not None:
        query = query.where(func.extract("year", Time.start) == year)

    time = session.exec(query).all()
    return time

@router.get("/day_of_year")
def get_time_by_day_of_year(
    session: SessionDep, year: Optional[int] = None
) -> list[DOYTime]:
    query = (
        select(
            func.extract("year", Time.start).label("year"),
            func.extract("doy", Time.start).label("day_of_year"),
            func.sum(func.extract("epoch", Time.end - Time.start) / 3600.0).label(
                "total_time"
            ),
        )
        .group_by(func.extract("year", Time.start), func.extract("doy", Time.start))
        .order_by(
            desc(func.extract("year", Time.start)),
            desc(func.extract("doy", Time.start)),
        )
    )

    if year is not None:
        query = query.where(func.extract("year", Time.start) == year)

    time = session.exec(query).all()
    return time

@router.get("/project")
def read_time_by_project(
    session: SessionDep, calendar_week: Optional[int] = None, year: Optional[int] = None
) -> list[ProjectTime]:
    query = (
        select(
            Project.name.label("project_name"),
            func.sum(func.extract("epoch", Time.end - Time.start) / 3600.0).label(
                "total_time"
            ),
        )
        .group_by(Project.id)
        .join(Project, Project.id == Time.project_id)
    )

    if calendar_week is not None:
        query = query.where(func.extract("week", Time.start) == calendar_week)

    if year is not None:
        query = query.where(func.extract("year", Time.start) == year)

    time = session.exec(query).all()
    return time


@router.post("/")
def create_time(time: CreateTime, session: SessionDep) -> Time:
    db_time = Time(**time.model_dump())
    session.add(db_time)
    session.commit()
    session.refresh(db_time)
    return db_time


@router.delete("/")
def delete_time(time_id: int, session: SessionDep):
    time = session.get(Time, time_id)

    if not time:
        return {"error": "Time entry not found"}

    session.delete(time)
    session.commit()
    return {"message": "Time entry deleted successfully"}
