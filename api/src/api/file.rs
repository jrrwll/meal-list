use axum::{Json, Router, extract::ConnectInfo, extract::Multipart, extract::State, routing::post};
use rexl::api::ApiResult;
use std::net::SocketAddr;

use crate::config::ApiState;
use crate::model::HostingUploadParam;
use crate::service::FileService;
use crate::util::AppResult;

pub fn get_routes() -> Router<ApiState> {
    Router::new()
        .route("/upload", post(upload_file))
        .route("/upload/hosting", post(upload_hosting))
}

async fn upload_file(
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    State(state): State<ApiState>,
    multipart: Multipart,
) -> AppResult<Json<ApiResult<String>>> {
    let url = FileService::upload_file(&state, multipart, addr).await?;
    Ok(Json(ApiResult::ok(url)))
}

async fn upload_hosting(
    State(state): State<ApiState>,
    Json(param): Json<HostingUploadParam>,
) -> AppResult<Json<ApiResult<String>>> {
    let url = FileService::upload_hosting(&state, param).await?;
    Ok(Json(ApiResult::ok(url)))
}
