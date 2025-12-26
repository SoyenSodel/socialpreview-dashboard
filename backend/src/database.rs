use sqlx::{sqlite::SqlitePool, Error, Row};
use uuid::Uuid;

use crate::models::{User, UserRole};

pub async fn init_db(database_url: &str) -> Result<SqlitePool, Error> {
    tracing::info!("Connecting to database...");

    let pool = SqlitePool::connect(database_url).await?;

    tracing::info!("Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    tracing::info!("Database initialized successfully");
    Ok(pool)
}

pub async fn find_user_by_email(pool: &SqlitePool, email: &str) -> Result<Option<User>, Error> {
    let row = sqlx::query(
        "SELECT id, name, nickname, email, password_hash, role, profile_picture, totp_secret, totp_enabled FROM users WHERE email = ?1"
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;

    match row {
        Some(r) => {
            let role_str: String = r.get("role");
            let role = match role_str.as_str() {
                "user" => UserRole::User,
                "team" => UserRole::Team,
                "management" => UserRole::Management,
                _ => return Err(Error::Decode(Box::new(std::io::Error::new(
                    std::io::ErrorKind::InvalidData,
                    "Invalid user role"
                )))),
            };

            let totp_enabled_int: i32 = r.get("totp_enabled");
            let totp_enabled = totp_enabled_int != 0;

            Ok(Some(User {
                id: Uuid::parse_str(r.get("id")).map_err(|e| {
                    Error::Decode(Box::new(std::io::Error::new(
                        std::io::ErrorKind::InvalidData,
                        e.to_string()
                    )))
                })?,
                name: r.get("name"),
                nickname: r.get("nickname"),
                email: r.get("email"),
                password_hash: r.get("password_hash"),
                role,
                profile_picture: r.get("profile_picture"),
                totp_secret: r.get("totp_secret"),
                totp_enabled,
            }))
        }
        None => Ok(None),
    }
}

pub async fn find_user_by_id(pool: &SqlitePool, id: &str) -> Result<Option<User>, Error> {
    let row = sqlx::query(
        "SELECT id, name, nickname, email, password_hash, role, profile_picture, totp_secret, totp_enabled FROM users WHERE id = ?1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    match row {
        Some(r) => {
            let role_str: String = r.get("role");
            let role = match role_str.as_str() {
                "user" => UserRole::User,
                "team" => UserRole::Team,
                "management" => UserRole::Management,
                _ => return Err(Error::Decode(Box::new(std::io::Error::new(
                    std::io::ErrorKind::InvalidData,
                    "Invalid user role"
                )))),
            };

            let totp_enabled_int: i32 = r.get("totp_enabled");
            let totp_enabled = totp_enabled_int != 0;

            Ok(Some(User {
                id: Uuid::parse_str(r.get("id")).map_err(|e| {
                    Error::Decode(Box::new(std::io::Error::new(
                        std::io::ErrorKind::InvalidData,
                        e.to_string()
                    )))
                })?,
                name: r.get("name"),
                nickname: r.get("nickname"),
                email: r.get("email"),
                password_hash: r.get("password_hash"),
                role,
                profile_picture: r.get("profile_picture"),
                totp_secret: r.get("totp_secret"),
                totp_enabled,
            }))
        }
        None => Ok(None),
    }
}

pub async fn update_password(
    pool: &SqlitePool,
    email: &str,
    new_password_hash: &str,
) -> Result<(), Error> {
    sqlx::query(
        "UPDATE users SET password_hash = ?1, updated_at = CURRENT_TIMESTAMP WHERE email = ?2"
    )
    .bind(new_password_hash)
    .bind(email)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn create_user(
    pool: &SqlitePool,
    name: &str,
    nickname: &str,
    email: &str,
    password_hash: &str,
    role: UserRole,
) -> Result<User, Error> {
    let id = Uuid::new_v4();
    let role_str = match role {
        UserRole::User => "user",
        UserRole::Team => "team",
        UserRole::Management => "management",
    };

    sqlx::query(
        "INSERT INTO users (id, name, nickname, email, password_hash, role) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    )
    .bind(id.to_string())
    .bind(name)
    .bind(nickname)
    .bind(email)
    .bind(password_hash)
    .bind(role_str)
    .execute(pool)
    .await?;

    Ok(User {
        id,
        name: name.to_string(),
        nickname: nickname.to_string(),
        email: email.to_string(),
        password_hash: password_hash.to_string(),
        role,
        profile_picture: None,
        totp_secret: None,
        totp_enabled: false,
    })
}

pub async fn update_profile(
    pool: &SqlitePool,
    user_id: &str,
    name: Option<&str>,
    nickname: Option<&str>,
    profile_picture: Option<&str>,
) -> Result<(), Error> {
    let mut updates = Vec::new();
    let mut query_str = "UPDATE users SET ".to_string();

    if name.is_some() {
        updates.push("name = ?");
    }
    if nickname.is_some() {
        updates.push("nickname = ?");
    }
    if profile_picture.is_some() {
        updates.push("profile_picture = ?");
    }

    if updates.is_empty() {
        return Ok(());
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    query_str.push_str(&updates.join(", "));
    query_str.push_str(" WHERE id = ?");

    let mut query = sqlx::query(&query_str);

    if let Some(n) = name {
        query = query.bind(n);
    }
    if let Some(nn) = nickname {
        query = query.bind(nn);
    }
    if let Some(pp) = profile_picture {
        query = query.bind(pp);
    }
    query = query.bind(user_id);

    query.execute(pool).await?;
    Ok(())
}

pub async fn update_member(
    pool: &SqlitePool,
    member_id: &str,
    name: Option<&str>,
    nickname: Option<&str>,
    email: Option<&str>,
    role: Option<UserRole>,
    password_hash: Option<&str>,
) -> Result<(), Error> {
    let mut updates = Vec::new();
    let mut query_str = "UPDATE users SET ".to_string();

    if name.is_some() {
        updates.push("name = ?");
    }
    if nickname.is_some() {
        updates.push("nickname = ?");
    }
    if email.is_some() {
        updates.push("email = ?");
    }
    if role.is_some() {
        updates.push("role = ?");
    }
    if password_hash.is_some() {
        updates.push("password_hash = ?");
    }

    if updates.is_empty() {
        return Ok(());
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    query_str.push_str(&updates.join(", "));
    query_str.push_str(" WHERE id = ?");

    let mut query = sqlx::query(&query_str);

    if let Some(n) = name {
        query = query.bind(n);
    }
    if let Some(nn) = nickname {
        query = query.bind(nn);
    }
    if let Some(e) = email {
        query = query.bind(e);
    }
    if let Some(r) = role {
        let role_str = match r {
            UserRole::User => "user",
            UserRole::Team => "team",
            UserRole::Management => "management",
        };
        query = query.bind(role_str);
    }
    if let Some(ph) = password_hash {
        query = query.bind(ph);
    }
    query = query.bind(member_id);

    query.execute(pool).await?;
    Ok(())
}

pub async fn delete_user(
    pool: &SqlitePool,
    user_id: &str,
) -> Result<(), Error> {
    sqlx::query("DELETE FROM users WHERE id = ?1")
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}
