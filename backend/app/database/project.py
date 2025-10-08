from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class CreateProject(BaseModel):
    name: str


class Project(SQLModel, table=True):
    __tablename__ = "TblProjects"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
