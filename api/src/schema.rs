diesel::table! {
    meal (id) {
        #[max_length = 50]
        id -> Varchar,
        #[max_length = 100]
        name -> Varchar,
        #[max_length = 500]
        description -> Nullable<Varchar>,
        #[max_length = 5000]
        images -> Varchar,
        #[max_length = 1000]
        tags -> Varchar,
        ctime -> Timestamp,
        mtime -> Timestamp,
        deleted -> Bool,
    }
}

diesel::table! {
    file (id) {
        #[max_length = 50]
        id -> Varchar,
        #[max_length = 200]
        filename -> Varchar,
        size -> BigInt,
        #[max_length = 500]
        url -> Varchar,
        #[max_length = 200]
        hosting_file -> Varchar,
        ctime -> Timestamp,
    }
}

diesel::table! {
    hosting_file (kind, file_id) {
        #[max_length = 50]
        kind -> Varchar,
        #[max_length = 100]
        file_id -> Varchar,
        extra -> Nullable<Text>,
        ctime -> Timestamp,
    }
}

diesel::allow_tables_to_appear_in_same_query!(meal, file, hosting_file);
