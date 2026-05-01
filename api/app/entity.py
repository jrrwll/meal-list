from datetime import datetime

from sqlmodel import SQLModel, Field


class Meal(SQLModel, table=True):
    id: str = Field(default=None, primary_key=True)
    name: str
    description: str | None
    images: str
    tags: str
    ctime: datetime
    mtime: datetime
    deleted: bool = False

class File(SQLModel, table=True):
    id: str = Field(default=None, primary_key=True) # md5
    filename: str
    size: int
    url: str
    ctime: datetime
