from fastapi import APIRouter
from sqlmodel import select, func
from app.database.db import SessionDep
from app.database.time import Time
from app.database.project import Project  # Make sure this import exists

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/calendar_week/")
def get_calendar_week_overview(session: SessionDep):
    sub_statement = select(
        Time.id,
        Project.name,
        Time.start,
        Time.end,
        (func.extract("epoch", Time.end - Time.start) / 3600.0).label("duration"),
        func.extract("week", Time.start).label("week"),
    ).where(Project.id == Time.project_id)

    statement = select(
        func.sum(sub_statement.c.duration), sub_statement.c.week
    ).group_by(sub_statement.c.week)

    result = session.exec(statement).all()
    print(result)

    return [
        {
            "duration": duration,
            "week": week,
        }
        for duration, week in result
    ]
