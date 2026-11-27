from datetime import date
from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class CreateWorkingHours(BaseModel):
    effective_date: date
    percentage: int = Field(ge=0, le=100)


class WorkingHours(SQLModel, table=True):
    __tablename__ = "tblworkinghours"
    id: Optional[int] = Field(default=None, primary_key=True)
    effective_date: date
    percentage: int
