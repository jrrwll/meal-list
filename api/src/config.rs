use std::sync::Arc;

use config::Config;
use diesel::sqlite::SqliteConnection;
use diesel_async::{AsyncConnection, sync_connection_wrapper::SyncConnectionWrapper};
use serde::{Deserialize, Serialize};

pub type DbConnection = SyncConnectionWrapper<SqliteConnection>;

pub const API_PREFIX_STR: &str = "/api/v1";
pub const UPLOAD_TEMP_DIR: &str = "workspace/upload";
pub const STATIC_FILE_DIR: &str = "images";

#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(default)]
pub struct AppConfig {
    #[serde(default = "default_host")]
    pub host: String,
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_database_uri")]
    pub database_uri: String,
    #[serde(default)]
    pub file_url_prefx: String,
}

fn default_host() -> String {
    "0.0.0.0".to_string()
}

fn default_port() -> u16 {
    5000
}

fn default_database_uri() -> String {
    "meal-list.db".to_string()
}

impl AppConfig {
    pub fn parse() -> Result<Self, Box<dyn std::error::Error>> {
        dotenvy::dotenv().ok(); // load .env
        let cfg = Config::builder()
            .add_source(config::Environment::default())
            .build()?
            .try_deserialize::<Self>()
            .expect("failed parse config from env");
        Ok(cfg)
    }

    pub fn build_addr(&self) -> String {
        format!("{}:{}", self.host, self.port)
    }
}

#[derive(Clone)]
pub struct ApiState {
    pub config: Arc<AppConfig>,
}

impl ApiState {
    pub async fn new(cfg: AppConfig) -> anyhow::Result<Self> {
        Ok(Self { config: Arc::new(cfg) })
    }

    pub async fn get_db_connection(&self) -> anyhow::Result<DbConnection> {
        let database_uri = &self.config.database_uri;
        let conn = SyncConnectionWrapper::<SqliteConnection>::establish(database_uri).await?;
        Ok(conn)
    }
}
