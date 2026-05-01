from datetime import datetime
import json
from typing import Self
from pydantic import BaseModel

from app.entity import Meal

class MealListParam(BaseModel):
    search: str | None = None
    year: int | None = None
    month: int | None = None
    tags: list[str] = []
    
class MealSimplePublic(BaseModel):
    id: str
    name: str
    description: str | None
    images: list[str]
    tags: list[str] = []
    ctime: datetime

    @classmethod
    def create(cls, entity: Meal) -> Self:
        model = cls.model_construct(**entity.model_dump())
        model.images = json.loads(entity.images)
        model.tags = json.loads(entity.tags)
        return model

class MealCreateParam(BaseModel):
    name: str
    description: str | None = None
    images: list[str]
    tags: list[str]

class MealUpdateParam(MealCreateParam):
    id: str

class TagSimplePublic(BaseModel):
    name: str
    count: int
