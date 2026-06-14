use diesel::prelude::*;
use diesel_async::RunQueryDsl;

use crate::config::DbConnection;
use crate::entity::Meal;
use crate::model::MealListParam;
use crate::schema::meal::dsl as m;

pub async fn list_meals(
    conn: &mut DbConnection, params: &MealListParam,
) -> anyhow::Result<Vec<Meal>> {
    let mut query = m::meal.into_boxed();
    query = query
        .order(m::ctime.desc())
        .filter(m::deleted.eq(false));

    if let Some(search) = params.search.as_ref().filter(|s| !s.is_empty()) {
        let pattern = format!("%{}%", search);
        query = query.filter(
            m::name
                .like(pattern.clone())
                .or(m::description.like(pattern)),
        );
    }
    if let Some(year) = params.year {
        let year_str = format!("{:04}", year);
        query = query.filter(
            diesel::dsl::sql::<diesel::sql_types::Bool>("strftime('%Y', ctime) = ")
                .bind::<diesel::sql_types::Text, _>(year_str),
        );
    }
    if let Some(month) = params.month {
        let month_str = format!("{:02}", month);
        query = query.filter(
            diesel::dsl::sql::<diesel::sql_types::Bool>("strftime('%m', ctime) = ")
                .bind::<diesel::sql_types::Text, _>(month_str),
        );
    }
    if !params.tags.is_empty() {
        let mut iter = params.tags.iter();
        let first = iter.next().unwrap();
        let mut tag_filter: Box<
            dyn diesel::BoxableExpression<
                    m::meal,
                    diesel::sqlite::Sqlite,
                    SqlType = diesel::sql_types::Bool,
                >,
        > = Box::new(m::tags.like(format!("%\"{}\"%", first)));
        for tag in iter {
            tag_filter = Box::new(tag_filter.or(m::tags.like(format!("%\"{}\"%", tag))));
        }
        query = query.filter(tag_filter);
    }

    let results = query.load::<Meal>(conn).await?;
    Ok(results)
}

pub async fn get_meal(conn: &mut DbConnection, id: &str) -> anyhow::Result<Option<Meal>> {
    let result = m::meal
        .filter(m::id.eq(id))
        .filter(m::deleted.eq(false))
        .first::<Meal>(conn)
        .await
        .optional()?;
    Ok(result)
}

pub async fn insert_meal(conn: &mut DbConnection, entity: &Meal) -> anyhow::Result<()> {
    diesel::insert_into(m::meal)
        .values(entity)
        .execute(conn)
        .await?;
    Ok(())
}

pub async fn update_meal_entity(conn: &mut DbConnection, entity: &Meal) -> anyhow::Result<usize> {
    let n = diesel::update(m::meal.filter(m::id.eq(&entity.id)))
        .set(entity)
        .execute(conn)
        .await?;
    Ok(n)
}
