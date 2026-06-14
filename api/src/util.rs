use std::path::Path;

use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use chrono::Local;
use md5::{Digest, Md5};
use rexl::api::ApiResult;
use serde::Serialize;
use tokio::fs::File;
use tokio::io::AsyncReadExt;
use uuid::Uuid;

pub fn uuid_no_hyphen() -> String {
    Uuid::new_v4().simple().to_string()
}

pub fn format_date_compact() -> String {
    Local::now().format("%Y%m%d").to_string()
}

pub async fn file_md5(path: impl AsRef<Path>) -> anyhow::Result<String> {
    let mut file = File::open(path).await?;
    let mut hasher = Md5::new();
    let mut buf = vec![0u8; 8 << 20];
    loop {
        let n = file.read(&mut buf).await?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(hex::encode(hasher.finalize()))
}

#[derive(Debug)]
pub enum AppError {
    Biz(String),
    Internal(anyhow::Error),
}

impl AppError {
    pub fn biz(msg: impl Into<String>) -> Self {
        AppError::Biz(msg.into())
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::Biz(msg) => write!(f, "{}", msg),
            AppError::Internal(e) => write!(f, "{}", e),
        }
    }
}

impl std::error::Error for AppError {}

impl From<anyhow::Error> for AppError {
    fn from(value: anyhow::Error) -> Self {
        AppError::Internal(value)
    }
}

impl From<std::io::Error> for AppError {
    fn from(value: std::io::Error) -> Self {
        AppError::Internal(value.into())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(value: serde_json::Error) -> Self {
        AppError::Internal(value.into())
    }
}

impl From<diesel::result::Error> for AppError {
    fn from(value: diesel::result::Error) -> Self {
        AppError::Internal(value.into())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::Biz(msg) => {
                let body = ApiResult::<()>::fail("err", msg);
                (StatusCode::BAD_REQUEST, Json(body)).into_response()
            }
            AppError::Internal(e) => {
                let body = ApiResult::<()>::fail("err", format!("{}", e));
                (StatusCode::INTERNAL_SERVER_ERROR, Json(body)).into_response()
            }
        }
    }
}

pub type AppResult<T> = Result<T, AppError>;

pub fn ok_json<T: Serialize + for<'de> serde::Deserialize<'de>>(data: T) -> Json<ApiResult<T>> {
    Json(ApiResult::ok(data))
}

pub fn ok_none() -> Json<ApiResult<()>> {
    Json(ApiResult::<()>::ok(None))
}
