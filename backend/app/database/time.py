from datetime import datetime
from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class CreateTime(BaseModel):
    project_id: int
    start: datetime
    end: datetime
    description: Optional[str] = None


class ProjectTime(BaseModel):
    project_name: str
    total_time: float


class KWTime(BaseModel):
    year: int
    calendar_week: int
    total_time: float

class DOYTime(BaseModel):
    year: int
    day_of_year: int
    total_time: float

class Time(SQLModel, table=True):
    __tablename__ = "tbltime"
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="tblprojects.id")
    start: datetime
    end: datetime
    description: Optional[str] = Field(default=None)
