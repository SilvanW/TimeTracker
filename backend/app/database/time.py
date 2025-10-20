from datetime import datetime
from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class CreateTime(BaseModel):
    project_id: int
    start: datetime
    end: datetime


class Time(SQLModel, table=True):
    __tablename__ = "tbltime"
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="tblprojects.id")
    start: datetime
    end: datetime
