use axum::{Json, Router, extract::State, routing::post};
use rexl::api::{ApiResult, PageResult};

use crate::config::ApiState;
use crate::model::{
    IdParam, IdResult, MealCreateParam, MealListParam, MealSimplePublic, MealUpdateParam,
    TagSimplePublic,
};
use crate::service::MealService;
use crate::util::AppResult;

pub fn get_routes() -> Router<ApiState> {
    Router::new().nest(
        "/meal",
        Router::new()
            .route("/list", post(list_meal))
            .route("/get", post(get_meal))
            .route("/create", post(create_meal))
            .route("/update", post(update_meal))
            .route("/delete", post(delete_meal))
            .route("/tag/list", post(list_tags)),
    )
}

async fn list_meal(
    State(state): State<ApiState>, Json(params): Json<MealListParam>,
) -> AppResult<Json<ApiResult<PageResult<MealSimplePublic>>>> {
    let items = MealService::list_meals(&state, &params).await?;
    let total = items.len() as u64;
    Ok(Json(ApiResult::page(total, items)))
}

async fn get_meal(
    State(state): State<ApiState>, Json(params): Json<IdParam>,
) -> AppResult<Json<ApiResult<MealSimplePublic>>> {
    let entity = MealService::get_meal(&state, &params.id).await?;
    Ok(Json(ApiResult::ok(entity)))
}

async fn create_meal(
    State(state): State<ApiState>, Json(params): Json<MealCreateParam>,
) -> AppResult<Json<ApiResult<IdResult>>> {
    let id = MealService::create_meal(&state, params).await?;
    Ok(Json(ApiResult::ok(IdResult { id })))
}

async fn update_meal(
    State(state): State<ApiState>, Json(params): Json<MealUpdateParam>,
) -> AppResult<Json<ApiResult<()>>> {
    MealService::update_meal(&state, params).await?;
    Ok(Json(ApiResult::<()>::ok(None)))
}

async fn delete_meal(
    State(state): State<ApiState>, Json(params): Json<IdParam>,
) -> AppResult<Json<ApiResult<()>>> {
    MealService::delete_meal(&state, &params.id).await?;
    Ok(Json(ApiResult::<()>::ok(None)))
}

async fn list_tags(
    State(state): State<ApiState>,
) -> AppResult<Json<ApiResult<PageResult<TagSimplePublic>>>> {
    let items = MealService::list_tags(&state).await?;
    let total = items.len() as u64;
    Ok(Json(ApiResult::page(total, items)))
}
