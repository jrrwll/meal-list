use std::net::SocketAddr;
use std::path::{Path, PathBuf};

use axum::extract::Multipart;
use chrono::Local;
use tokio::fs;
use tokio::io::AsyncWriteExt;
use tracing::{info, warn};

use crate::config::{ApiState, STATIC_FILE_DIR, UPLOAD_TEMP_DIR};
use crate::dao::file as dao;
use crate::entity::{File, HostingFile};
use crate::model::HostingUploadParam;
use crate::util::{AppError, AppResult, file_md5, format_date_compact, uuid_no_hyphen};

pub struct FileService;

impl FileService {
    pub async fn upload_file(
        state: &ApiState, mut multipart: Multipart, addr: SocketAddr,
    ) -> AppResult<String> {
        let mut filename: Option<String> = None;
        let mut data: Option<Vec<u8>> = None;

        while let Some(field) = multipart
            .next_field()
            .await
            .map_err(|e| AppError::biz(format!("invalid multipart: {}", e)))?
        {
            if field.name() == Some("file") {
                filename = field.file_name().map(|s| s.to_string());
                data = Some(
                    field
                        .bytes()
                        .await
                        .map_err(|e| AppError::biz(format!("read upload data failed: {}", e)))?
                        .to_vec(),
                );
                break;
            }
        }

        let filename = filename.ok_or_else(|| AppError::biz("unsupported file"))?;
        let data = data.ok_or_else(|| AppError::biz("unsupported file"))?;
        let size = data.len() as i64;

        println!("[{}] POST /api/v1/upload file={} size={}", addr, filename, size);

        let now_date_str = format_date_compact();
        let file_dir = format!("{}/{}", UPLOAD_TEMP_DIR, now_date_str);
        fs::create_dir_all(&file_dir).await?;

        let suffix = Path::new(&filename)
            .extension()
            .map(|s| format!(".{}", s.to_string_lossy()))
            .unwrap_or_default();

        let temp_name = format!("{}{}", uuid_no_hyphen(), suffix);
        let file_temp_path = PathBuf::from(&file_dir).join(&temp_name);
        let mut buf = fs::File::create(&file_temp_path).await?;
        buf.write_all(&data).await?;
        buf.flush().await?;
        drop(buf);

        let id = file_md5(&file_temp_path).await?;

        let mut conn = state.get_db_connection().await?;
        if let Some(existing) = dao::get_file(&mut conn, &id).await? {
            warn!("file {} already exists, returning existing url", id);
            let _ = fs::remove_file(&file_temp_path).await;
            return Ok(existing.url);
        }

        let static_file_dir = format!("{}/{}", STATIC_FILE_DIR, now_date_str);
        fs::create_dir_all(&static_file_dir).await?;

        let static_file_name = format!("{}{}", id, suffix);
        let static_file_path = PathBuf::from(&static_file_dir).join(&static_file_name);
        info!(
            "moving upload file {} to {}",
            file_temp_path.display(),
            static_file_path.display()
        );
        fs::rename(&file_temp_path, &static_file_path).await?;

        let url = format!("/{}/{}", now_date_str, static_file_name);
        let entity = File {
            id: id.clone(),
            filename,
            size,
            url: url.clone(),
            hosting_file: String::new(),
            ctime: Local::now().naive_local(),
        };
        dao::insert_file(&mut conn, &entity).await?;
        Ok(url)
    }

    pub async fn upload_hosting(state: &ApiState, param: HostingUploadParam) -> AppResult<String> {
        let mut conn = state.get_db_connection().await?;

        // 1. check fingerprint: find file by md5 id
        if let Some(existing) = dao::get_file(&mut conn, &param.fingerprint).await? {
            info!(
                "hosting upload: fingerprint {} already exists, returning {}",
                param.fingerprint, existing.url
            );
            return Ok(existing.url);
        }

        // 2. check kind+file_id uniqueness
        if dao::get_hosting_file(&mut conn, &param.kind, &param.file_id)
            .await?
            .is_some()
        {
            return Err(AppError::biz("file alredy existing, overwrite is forbidden"));
        }

        // 3. insert hosting_file
        let extra = param.extra.as_ref().map(|v| v.to_string());
        let hosting = HostingFile {
            kind: param.kind.clone(),
            file_id: param.file_id.clone(),
            extra,
            ctime: Local::now().naive_local(),
        };
        dao::insert_hosting_file(&mut conn, &hosting).await?;

        // 4. insert file
        let file = File {
            id: param.fingerprint.clone(),
            filename: param.filename,
            size: param.size,
            url: param.url.clone(),
            hosting_file: format!("{}:{}", param.kind, param.file_id),
            ctime: Local::now().naive_local(),
        };
        dao::insert_file(&mut conn, &file).await?;

        Ok(param.url)
    }
}
