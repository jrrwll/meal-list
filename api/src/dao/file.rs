use diesel::prelude::*;
use diesel_async::RunQueryDsl;

use crate::config::DbConnection;
use crate::entity::{File, HostingFile};
use crate::schema::{file::dsl as f, hosting_file::dsl as h};

pub async fn get_file(conn: &mut DbConnection, id: &str) -> anyhow::Result<Option<File>> {
    let result = f::file
        .filter(f::id.eq(id))
        .first::<File>(conn)
        .await
        .optional()?;
    Ok(result)
}

pub async fn insert_file(conn: &mut DbConnection, entity: &File) -> anyhow::Result<()> {
    diesel::insert_into(f::file)
        .values(entity)
        .execute(conn)
        .await?;
    Ok(())
}

pub async fn get_hosting_file(
    conn: &mut DbConnection,
    kind: &str,
    file_id: &str,
) -> anyhow::Result<Option<HostingFile>> {
    let result = h::hosting_file
        .filter(h::kind.eq(kind).and(h::file_id.eq(file_id)))
        .first::<HostingFile>(conn)
        .await
        .optional()?;
    Ok(result)
}

pub async fn insert_hosting_file(
    conn: &mut DbConnection,
    entity: &HostingFile,
) -> anyhow::Result<()> {
    diesel::insert_into(h::hosting_file)
        .values(entity)
        .execute(conn)
        .await?;
    Ok(())
}
