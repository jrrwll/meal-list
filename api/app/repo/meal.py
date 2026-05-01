import json
from datetime import datetime
from typing import Sequence
from uuid import uuid4

from sqlmodel import or_, extract, select

from app.config import SessionDep
from app.entity import Meal
from app.model import MealCreateParam, MealListParam, MealUpdateParam


def list_meals(session: SessionDep, params: MealListParam) -> Sequence[Meal]:
    statement = select(Meal)
    if params.search:
        search_value = f"%{params.search}%"
        statement = statement.where(
            or_(
                Meal.name.like(search_value),  # type: ignore[attr-defined]
                Meal.description.like(search_value),  # type: ignore[attr-defined]
            )
        )
    if params.year:
        statement = statement.where(extract('year', Meal.ctime) == params.year)  # type: ignore[attr-defined]
    if params.month:
        statement = statement.where(extract('month', Meal.ctime) == params.month)  # type: ignore[attr-defined]
    if params.tags:
        tag_conditions = []
        for tag in params.tags:
            tag_conditions.append(Meal.tags.like(f'%"{tag}"%')) # type: ignore[attr-defined]
        statement = statement.where(or_(*tag_conditions))    

    return session.exec(statement).all()


def get_meal(session: SessionDep, id: str) -> Meal | None:
    statement = select(Meal).where(Meal.id == id, Meal.deleted == 0)
    return session.exec(statement).first()


def create_meal(session: SessionDep, params: MealCreateParam) -> str:
    id = str(uuid4()).replace("-", "")
    entity = Meal(id=id, **params.model_dump())
    entity.images = json.dumps(params.images)
    entity.tags = json.dumps(params.tags, ensure_ascii=False)
    entity.ctime = datetime.now()
    entity.mtime = datetime.now()

    session.add(entity)
    session.commit()
    return id


def update_meal(session: SessionDep, params: MealUpdateParam) -> bool:
    entity = get_meal(session, params.id)
    if not entity:
        return False

    entity.name = params.name
    entity.description = params.description
    entity.images = json.dumps(params.images)
    entity.tags = json.dumps(params.tags)
    entity.mtime = datetime.now()
    session.commit()
    return True


def delete_meal(session: SessionDep, id: str) -> bool:
    entity = get_meal(session, id)
    if not entity:
        return False

    entity.deleted = True
    entity.mtime = datetime.now()
    session.commit()
    return True
