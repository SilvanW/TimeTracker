from fastapi import APIRouter
from sqlmodel import select

from app.database.db import SessionDep
from app.database.time import CreateTime, Time

router = APIRouter(prefix="/time", tags=["time"])


@router.get("/")
def read_time(session: SessionDep) -> list[Time]:
    time = session.exec(select(Time)).all()
    return time


@router.post("/")
def create_time(time: CreateTime, session: SessionDep) -> Time:
    db_time = Time(**time.model_dump())
    session.add(db_time)
    session.commit()
    session.refresh(db_time)
    return db_time


@router.delete("/")
def delete_project(time_id: int, session: SessionDep):
    time = session.get(Time, time_id)

    if not time:
        return {"error": "Time entry not found"}

    session.delete(time)
    session.commit()
    return {"message": "Time entry deleted successfully"}
