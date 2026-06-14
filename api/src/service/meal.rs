use std::collections::HashMap;

use chrono::Local;

use crate::config::ApiState;
use crate::dao::meal as dao;
use crate::entity::Meal;
use crate::model::{
    MealCreateParam, MealListParam, MealSimplePublic, MealUpdateParam, TagSimplePublic,
};
use crate::util::{AppError, AppResult, uuid_no_hyphen};

pub struct MealService;

impl MealService {
    pub async fn list_meals(
        state: &ApiState, params: &MealListParam,
    ) -> AppResult<Vec<MealSimplePublic>> {
        let mut conn = state.get_db_connection().await?;
        let entities = dao::list_meals(&mut conn, params).await?;
        let prefix = state.config.file_url_prefx.as_str();
        Ok(entities
            .iter()
            .map(|e| MealSimplePublic::create(e, prefix))
            .collect())
    }

    pub async fn get_meal(state: &ApiState, id: &str) -> AppResult<MealSimplePublic> {
        let mut conn = state.get_db_connection().await?;
        let entity = dao::get_meal(&mut conn, id).await?;
        let entity = entity.ok_or_else(|| AppError::biz(format!("meal not found: {}", id)))?;
        Ok(MealSimplePublic::create(&entity, state.config.file_url_prefx.as_str()))
    }

    pub async fn create_meal(state: &ApiState, params: MealCreateParam) -> AppResult<String> {
        let mut conn = state.get_db_connection().await?;
        let id = uuid_no_hyphen();
        let now = Local::now().naive_local();
        let entity = Meal {
            id: id.clone(),
            name: params.name,
            description: params.description,
            images: serde_json::to_string(&params.images)?,
            tags: serde_json::to_string(&params.tags)?,
            ctime: now,
            mtime: now,
            deleted: false,
        };
        dao::insert_meal(&mut conn, &entity).await?;
        Ok(id)
    }

    pub async fn update_meal(state: &ApiState, params: MealUpdateParam) -> AppResult<bool> {
        let mut conn = state.get_db_connection().await?;
        let entity = dao::get_meal(&mut conn, &params.id).await?;
        let Some(mut entity) = entity else {
            return Err(AppError::biz(format!("meal not found: {}", params.id)));
        };
        entity.name = params.name;
        entity.description = params.description;
        entity.images = serde_json::to_string(&params.images)?;
        entity.tags = serde_json::to_string(&params.tags)?;
        entity.mtime = Local::now().naive_local();
        dao::update_meal_entity(&mut conn, &entity).await?;
        Ok(true)
    }

    pub async fn delete_meal(state: &ApiState, id: &str) -> AppResult<bool> {
        let mut conn = state.get_db_connection().await?;
        let entity = dao::get_meal(&mut conn, id).await?;
        let Some(mut entity) = entity else {
            return Ok(false);
        };
        entity.deleted = true;
        entity.mtime = Local::now().naive_local();
        dao::update_meal_entity(&mut conn, &entity).await?;
        Ok(true)
    }

    pub async fn list_tags(state: &ApiState) -> AppResult<Vec<TagSimplePublic>> {
        let mut conn = state.get_db_connection().await?;
        let entities = dao::list_meals(&mut conn, &MealListParam::default()).await?;
        let prefix = state.config.file_url_prefx.as_str();

        let mut tags: HashMap<String, TagSimplePublic> = HashMap::new();
        for entity in &entities {
            let model = MealSimplePublic::create(entity, prefix);
            for tag in model.tags {
                tags.entry(tag.clone())
                    .and_modify(|t| t.count += 1)
                    .or_insert(TagSimplePublic { name: tag, count: 1 });
            }
        }
        let mut list: Vec<TagSimplePublic> = tags.into_values().collect();
        list.sort_by_key(|x| std::cmp::Reverse(x.count));
        Ok(list)
    }
}
