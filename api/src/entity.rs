use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::schema::{file, hosting_file, meal};

#[derive(
    Queryable,
    Selectable,
    Insertable,
    Identifiable,
    AsChangeset,
    Debug,
    Clone,
    Serialize,
    Deserialize,
)]
#[diesel(table_name = meal)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct Meal {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub images: String,
    pub tags: String,
    pub ctime: NaiveDateTime,
    pub mtime: NaiveDateTime,
    pub deleted: bool,
}

#[derive(Queryable, Selectable, Insertable, Identifiable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = file)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct File {
    pub id: String,
    pub filename: String,
    pub size: i64,
    pub url: String,
    pub hosting_file: String,
    pub ctime: NaiveDateTime,
}

#[derive(Queryable, Selectable, Insertable, Identifiable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = hosting_file)]
#[diesel(primary_key(kind, file_id))]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
pub struct HostingFile {
    pub kind: String,
    pub file_id: String,
    pub extra: Option<String>,
    pub ctime: NaiveDateTime,
}
