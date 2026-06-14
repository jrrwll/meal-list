use axum::{Json, Router, extract::State, routing::get};
use rexl::api::ApiResult;

use crate::config::ApiState;
use crate::util::AppResult;

pub fn get_routes() -> Router<ApiState> {
    Router::new().route("/ready", get(ready))
}

async fn ready(State(_): State<ApiState>) -> AppResult<Json<ApiResult<()>>> {
    Ok(Json(ApiResult::ok(())))
}
