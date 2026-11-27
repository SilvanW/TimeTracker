from fastapi import APIRouter
from sqlmodel import select

from app.database.db import SessionDep
from app.database.working_hours import CreateWorkingHours, WorkingHours

router = APIRouter(prefix="/working_hours", tags=["working_hours"])


@router.get("/")
def read_working_hours(session: SessionDep) -> list[WorkingHours]:
    query = select(WorkingHours).order_by(WorkingHours.effective_date, WorkingHours.id)
    return session.exec(query).all()


@router.post("/")
def create_working_hours(
    working_hours: CreateWorkingHours, session: SessionDep
) -> WorkingHours:
    db_working_hours = WorkingHours(**working_hours.model_dump())
    session.add(db_working_hours)
    session.commit()
    session.refresh(db_working_hours)
    return db_working_hours


@router.delete("/{working_hours_id}")
def delete_working_hours(working_hours_id: int, session: SessionDep) -> dict:
    working_hours = session.get(WorkingHours, working_hours_id)

    if not working_hours:
        return {"error": "Working hours not found"}

    session.delete(working_hours)
    session.commit()
    return {"message": "Working hours deleted successfully"}
