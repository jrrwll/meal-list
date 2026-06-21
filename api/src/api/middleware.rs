use axum::{
    body::Body,
    extract::{ConnectInfo, Request},
    http::header::CONTENT_TYPE,
    middleware::Next,
    response::Response,
};
use std::net::SocketAddr;

pub async fn request_logger(
    ConnectInfo(addr): ConnectInfo<SocketAddr>, req: Request, next: Next,
) -> Response {
    let method = req.method().clone();
    let path = req.uri().path().to_string();

    let is_api = path.starts_with("/api/");
    if !is_api {
        println!("[{}] {} {}", addr, method, path);
        return next.run(req).await;
    }

    let is_multipart = req
        .headers()
        .get(CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.starts_with("multipart/form-data"))
        .unwrap_or(false);

    if is_multipart {
        return next.run(req).await;
    }

    let (parts, body) = req.into_parts();
    let body_bytes = axum::body::to_bytes(body, 1024 * 1024)
        .await
        .unwrap_or_default();
    let body_str = String::from_utf8_lossy(&body_bytes);
    println!("[{}] {} {} body={}", addr, method, path, body_str.trim());

    let req = Request::from_parts(parts, Body::from(body_bytes));
    next.run(req).await
}
