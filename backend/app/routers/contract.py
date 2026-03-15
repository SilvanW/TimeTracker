from sqlmodel import desc, select, func
from fastapi import APIRouter

from app.database.contract import WeeklyHours
from app.database.db import SessionDep
from app.database.time import Time

router = APIRouter(prefix="/contracts", tags=["contracts"])

@router.get("/weekly_hours")
def get_weekly_hours(session: SessionDep) -> list[WeeklyHours]:
    # Check which weeks have time entries and return the hours for those weeks
    query = select(
        func.extract("year", Time.start).label("year"),
        func.extract("week", Time.start).label("calendar_week"),
    ).group_by(func.extract("year", Time.start), func.extract("week", Time.start)).order_by(
        desc(func.extract("year", Time.start)),
        desc(func.extract("week", Time.start)),
    )

    result = session.exec(query).all()

    # TODO: adjust daily hours based on free time entires and get daily hours from .env
    return [WeeklyHours(year=res.year, calendar_week=res.calendar_week, daily_hours=8.6, days=5.0 if res.calendar_week != 11 else 4.0) for res in result]