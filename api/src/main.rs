use anyhow::anyhow;
use axum::Router;
use meal_list::api;
use meal_list::config::{API_PREFIX_STR, ApiState, AppConfig};
use std::net::SocketAddr;
use std::{backtrace::Backtrace, panic};
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::{ServeDir, ServeFile};

#[tokio::main]
pub async fn main() -> Result<(), Box<dyn std::error::Error>> {
    panic::set_hook(Box::new(|info| {
        let backtrace = Backtrace::force_capture();
        eprintln!("!!! PANIC !!!");
        if let Some(location) = info.location() {
            eprintln!("  at {}:{}:{}", location.file(), location.line(), location.column());
        }
        if let Some(msg) = info.payload().downcast_ref::<&str>() {
            eprintln!("  message: {}", msg);
        } else if let Some(msg) = info.payload().downcast_ref::<String>() {
            eprintln!("  message: {}", msg);
        }
        eprintln!("  backtrace:\n{}", backtrace);
    }));

    let cfg = AppConfig::parse()?;
    let addr = cfg.build_addr();

    let state = ApiState::new(cfg).await?;

    let api_router = Router::new()
        .merge(api::common::get_routes())
        .merge(api::meal::get_routes())
        .merge(api::file::get_routes());

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .nest(API_PREFIX_STR, api_router)
        .nest_service("/img", ServeDir::new("images"))
        // mount dist as root
        .fallback_service(ServeDir::new("dist"))
        .nest_service("/assets", ServeDir::new("dist/assets"))
        .nest_service("/favicon.svg", ServeFile::new("dist/favicon.svg"))
        .layer(axum::middleware::from_fn(api::middleware::request_logger))
        .with_state(state)
        .layer(cors);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .map_err(|e| anyhow!("failed to bind addr {}: {}", addr, e))?;

    println!("listening on {}", addr);
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .map_err(|e| anyhow!("failed to start axum server: {}", e))?;
    Ok(())
}
