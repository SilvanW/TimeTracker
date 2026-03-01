from typing import Optional

from sqlmodel import Field, SQLModel
from pydantic import BaseModel


class CreateProjectBudget(BaseModel):
    year: int
    time_budget_hours: int
    budget_source: Optional[str] = None


class ProjectBudget(SQLModel, table=True):
    __tablename__ = "tblprojectbudget"
    id: int = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="tblprojects.id", nullable=False)
    year: int = Field(nullable=False)
    time_budget_hours: int = Field(nullable=False)
    budget_source: str = Field(default=None, nullable=True)
