from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class CreateProjectBudget(BaseModel):
    # year null = total budget across all years
    year: Optional[int] = None
    time_budget_hours: int = Field(ge=1)
    budget_source: Optional[str] = None


class ProjectBudget(SQLModel, table=True):
    __tablename__ = "tblprojectbudget"
    id: int = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="tblprojects.id", nullable=False)
    year: Optional[int] = Field(default=None, nullable=True)
    time_budget_hours: int = Field(nullable=False)
    budget_source: Optional[str] = Field(default=None, nullable=True)
