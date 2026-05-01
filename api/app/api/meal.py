from typing import Any
from corepy.api.result import ApiResult, IdResult, ListResult
from fastapi.routing import APIRouter

from app.config import SessionDep
from app.model import MealCreateParam, MealListParam, MealSimplePublic, MealUpdateParam, TagSimplePublic
from app.repo.meal import create_meal, delete_meal, get_meal, list_meals, update_meal
from app.service.meal import list_tags
from app.common import BizException

router = APIRouter(prefix="/meal", tags=["meal"])

@router.post("/list", response_model=ApiResult[ListResult[MealSimplePublic]])
def _list(session: SessionDep, params: MealListParam) -> Any:
    entities = list_meals(session, params)
    res = [MealSimplePublic.create(entity) for entity in entities]
    return ApiResult.ok(ListResult.create(res))

@router.post("/get", response_model=ApiResult[MealSimplePublic])
def _get(session: SessionDep, id: str) -> Any:
    entity = get_meal(session, id)
    print(f"entity {entity}")
    if not entity:
        raise BizException(f"meal not found: {id}")
    return ApiResult.ok(MealSimplePublic.create(entity))

@router.post("/create", response_model=ApiResult[IdResult])
def _create(session: SessionDep, params: MealCreateParam) -> Any:
    res = create_meal(session, params)
    return ApiResult.ok(IdResult(id=res))

@router.post("/update", response_model=ApiResult[None])
def _update(session: SessionDep, params: MealUpdateParam) -> Any:
    if not update_meal(session, params):
        raise BizException(f"meal not found: {params.id}")
    return ApiResult.ok()

@router.post("/delete", response_model=ApiResult[None])
def _delete(session: SessionDep, id: str) -> Any:
    delete_meal(session, id)
    return ApiResult.ok()


@router.post("/tag/list", response_model=ApiResult[ListResult[TagSimplePublic]])
def _tag_list(session: SessionDep, name: str | None = None) -> Any:
    res = list_tags(session, name)
    return ApiResult.ok(ListResult.create(res))
