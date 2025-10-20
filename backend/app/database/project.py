from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class CreateProject(BaseModel):
    name: str


class Project(SQLModel, table=True):
    __tablename__ = "tblprojects"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    project_nr: Optional[int] = Field(default=None)
