use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

use crate::entity::Meal;

#[derive(Debug, Default, Deserialize)]
pub struct MealListParam {
    pub search: Option<String>,
    pub year: Option<i32>,
    pub month: Option<u32>,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct MealCreateParam {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    pub images: Vec<String>,
    pub tags: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct MealUpdateParam {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    pub images: Vec<String>,
    pub tags: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct IdParam {
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MealSimplePublic {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub images: Vec<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub ctime: NaiveDateTime,
}

impl MealSimplePublic {
    pub fn create(entity: &Meal, file_url_prefix: &str) -> Self {
        let raw_images: Vec<String> = serde_json::from_str(&entity.images).unwrap_or_default();
        let images = raw_images
            .into_iter()
            .map(|image| {
                if image.starts_with('/') { format!("{}{}", file_url_prefix, image) } else { image }
            })
            .collect();
        let tags: Vec<String> = serde_json::from_str(&entity.tags).unwrap_or_default();
        MealSimplePublic {
            id: entity.id.clone(),
            name: entity.name.clone(),
            description: entity.description.clone(),
            images,
            tags,
            ctime: entity.ctime,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TagSimplePublic {
    pub name: String,
    pub count: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IdResult {
    pub id: String,
}

#[derive(Debug, Deserialize)]
pub struct HostingUploadParam {
    pub fingerprint: String,
    pub kind: String,
    pub file_id: String,
    pub filename: String,
    pub size: i64,
    pub url: String,
    #[serde(default)]
    pub extra: Option<serde_json::Value>,
}
