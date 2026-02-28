from sqlmodel import Field, SQLModel
from pydantic import BaseModel


class CreateProjectTime(BaseModel):
    year: int
    time_budget_hours: int


# TODO: not really happy with the name project time as it is not clear wheter it is the time available or the time worked on the project
class ProjectTime(SQLModel, table=True):
    __tablename__ = "tblprojecttime"
    id: int = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="tblprojects.id", nullable=False)
    year: int = Field(nullable=False)
    time_budget_hours: int = Field(nullable=False)
