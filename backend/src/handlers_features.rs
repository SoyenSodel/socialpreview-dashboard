use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Json},
    Extension,
};
use serde_json::json;
use uuid::Uuid;

use crate::{
    models::{Claims, CreateAbsenceRequest, UpdateAbsenceRequest, CreateNewsRequest, UpdateNewsRequest, CreateBlogPostRequest, UpdateBlogPostRequest, Absence, News, BlogPost, UserInfo},
    AppState,
};

pub async fn create_absence(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateAbsenceRequest>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({
            "success": false,
            "error": "Access denied"
        })));
    }

    let absence_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now();
    let now_str = now.to_rfc3339();

    let start_date = if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(&payload.start_date) {
        Some(dt.with_timezone(&chrono::Utc))
    } else {
        chrono::NaiveDate::parse_from_str(&payload.start_date, "%Y-%m-%d")
            .ok()
            .and_then(|d| d.and_hms_opt(0, 0, 0))
            .map(|dt| dt.and_utc())
    };

    let end_date = if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(&payload.end_date) {
        Some(dt.with_timezone(&chrono::Utc))
    } else {
        chrono::NaiveDate::parse_from_str(&payload.end_date, "%Y-%m-%d")
            .ok()
            .and_then(|d| d.and_hms_opt(23, 59, 59))
            .map(|dt| dt.and_utc())
    };

    let status = if let (Some(start), Some(end)) = (start_date, end_date) {
        if start <= now && end >= now {
            "approved"
        } else {
            "pending"
        }
    } else {
        "pending"
    };

    let result = sqlx::query(
        "INSERT INTO absences (id, user_id, reason, description, start_date, end_date, status, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)"
    )
    .bind(&absence_id)
    .bind(&claims.sub)
    .bind(&payload.reason)
    .bind(&payload.description)
    .bind(&payload.start_date)
    .bind(&payload.end_date)
    .bind(status)
    .bind(&now_str)
    .bind(&now_str)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(json!({ "success": true, "absence_id": absence_id }))),
        Err(e) => {
            tracing::error!("Failed to create absence: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to create absence" })))
        }
    }
}

pub async fn get_absences(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let _ = sqlx::query(
        "UPDATE absences SET status = 'rejected', updated_at = datetime('now')
         WHERE status = 'pending' AND end_date < datetime('now')"
    )
    .execute(&state.db)
    .await;

    let rows = sqlx::query(
        "SELECT a.id, a.user_id, a.reason, a.description, a.start_date, a.end_date, a.status, a.approved_by, a.created_at, a.updated_at,
                u1.name as user_name, u2.name as approved_by_name
         FROM absences a
         LEFT JOIN users u1 ON a.user_id = u1.id
         LEFT JOIN users u2 ON a.approved_by = u2.id
         ORDER BY a.created_at DESC"
    )
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(rows) => {
            let absences: Vec<Absence> = rows.iter().map(|row| {
                use sqlx::Row;
                let status_str: String = row.get("status");

                Absence {
                    id: row.get("id"),
                    user_id: row.get("user_id"),
                    user_name: row.get("user_name"),
                    reason: row.get("reason"),
                    description: row.get("description"),
                    start_date: row.get("start_date"),
                    end_date: row.get("end_date"),
                    status: match status_str.as_str() {
                        "pending" => crate::models::AbsenceStatus::Pending,
                        "approved" => crate::models::AbsenceStatus::Approved,
                        _ => crate::models::AbsenceStatus::Rejected,
                    },
                    approved_by: row.get("approved_by"),
                    approved_by_name: row.get("approved_by_name"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                }
            }).collect();

            (StatusCode::OK, Json(json!({ "absences": absences })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch absences: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to fetch absences" })))
        }
    }
}

pub async fn update_absence(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(absence_id): Path<String>,
    Json(payload): Json<UpdateAbsenceRequest>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let now = chrono::Utc::now().to_rfc3339();
    let status_str = match payload.status {
        crate::models::AbsenceStatus::Pending => "pending",
        crate::models::AbsenceStatus::Approved => "approved",
        crate::models::AbsenceStatus::Rejected => "rejected",
    };

    let result = sqlx::query(
        "UPDATE absences SET status = ?1, approved_by = ?2, updated_at = ?3 WHERE id = ?4"
    )
    .bind(status_str)
    .bind(&claims.sub)
    .bind(&now)
    .bind(&absence_id)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(json!({ "success": true }))),
        Err(e) => {
            tracing::error!("Failed to update absence: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to update absence" })))
        }
    }
}

pub async fn create_news(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateNewsRequest>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let news_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let result = sqlx::query(
        "INSERT INTO news (id, title, content, author_id, is_pinned, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"
    )
    .bind(&news_id)
    .bind(&payload.title)
    .bind(&payload.content)
    .bind(&claims.sub)
    .bind(payload.is_pinned.unwrap_or(false))
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(json!({ "success": true, "news_id": news_id }))),
        Err(e) => {
            tracing::error!("Failed to create news: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to create news" })))
        }
    }
}

pub async fn get_news(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let rows = sqlx::query(
        "SELECT n.id, n.title, n.content, n.author_id, n.is_pinned, n.created_at, n.updated_at, u.name as author_name
         FROM news n
         LEFT JOIN users u ON n.author_id = u.id
         ORDER BY n.is_pinned DESC, n.created_at DESC"
    )
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(rows) => {
            let news: Vec<News> = rows.iter().map(|row| {
                use sqlx::Row;
                News {
                    id: row.get("id"),
                    title: row.get("title"),
                    content: row.get("content"),
                    author_id: row.get("author_id"),
                    author_name: row.get("author_name"),
                    is_pinned: row.get("is_pinned"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                }
            }).collect();

            (StatusCode::OK, Json(json!({ "news": news })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch news: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to fetch news" })))
        }
    }
}

pub async fn update_news(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(news_id): Path<String>,
    Json(payload): Json<UpdateNewsRequest>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let now = chrono::Utc::now().to_rfc3339();
    let mut updates = Vec::new();
    let mut values: Vec<String> = Vec::new();

    if let Some(title) = payload.title {
        updates.push("title = ?");
        values.push(title);
    }
    if let Some(content) = payload.content {
        updates.push("content = ?");
        values.push(content);
    }
    if let Some(is_pinned) = payload.is_pinned {
        updates.push("is_pinned = ?");
        values.push(if is_pinned { "1".to_string() } else { "0".to_string() });
    }

    if updates.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({ "success": false, "error": "No updates provided" })));
    }

    updates.push("updated_at = ?");
    values.push(now);

    let query_str = format!("UPDATE news SET {} WHERE id = ?", updates.join(", "));
    let mut query = sqlx::query(&query_str);
    for value in values {
        query = query.bind(value);
    }
    query = query.bind(&news_id);

    match query.execute(&state.db).await {
        Ok(_) => (StatusCode::OK, Json(json!({ "success": true }))),
        Err(e) => {
            tracing::error!("Failed to update news: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to update news" })))
        }
    }
}

pub async fn delete_news(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(news_id): Path<String>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    match sqlx::query("DELETE FROM news WHERE id = ?1").bind(&news_id).execute(&state.db).await {
        Ok(_) => (StatusCode::OK, Json(json!({ "success": true }))),
        Err(e) => {
            tracing::error!("Failed to delete news: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to delete news" })))
        }
    }
}

fn create_slug(title: &str) -> String {
    title.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() || c == ' ' { c } else { ' ' })
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<&str>>()
        .join("-")
}

pub async fn create_blog_post(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateBlogPostRequest>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let post_id = Uuid::new_v4().to_string();
    let slug = create_slug(&payload.title);
    let now = chrono::Utc::now().to_rfc3339();

    let status_str = match payload.status.unwrap_or(crate::models::BlogStatus::Draft) {
        crate::models::BlogStatus::Draft => "draft",
        crate::models::BlogStatus::Published => "published",
        crate::models::BlogStatus::Archived => "archived",
    };

    let published_at = if status_str == "published" { Some(now.clone()) } else { None };

    let result = sqlx::query(
        "INSERT INTO blog_posts (id, title, slug, content, excerpt, author_id, status, published_at, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
    )
    .bind(&post_id)
    .bind(&payload.title)
    .bind(&slug)
    .bind(&payload.content)
    .bind(&payload.excerpt)
    .bind(&claims.sub)
    .bind(status_str)
    .bind(&published_at)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(json!({ "success": true, "post_id": post_id, "slug": slug }))),
        Err(e) => {
            tracing::error!("Failed to create blog post: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to create blog post" })))
        }
    }
}

pub async fn get_blog_posts(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let rows = sqlx::query(
        "SELECT b.id, b.title, b.slug, b.content, b.excerpt, b.author_id, b.status, b.published_at, b.created_at, b.updated_at, u.name as author_name
         FROM blog_posts b
         LEFT JOIN users u ON b.author_id = u.id
         ORDER BY b.created_at DESC"
    )
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(rows) => {
            let posts: Vec<BlogPost> = rows.iter().map(|row| {
                use sqlx::Row;
                let status_str: String = row.get("status");

                BlogPost {
                    id: row.get("id"),
                    title: row.get("title"),
                    slug: row.get("slug"),
                    content: row.get("content"),
                    excerpt: row.get("excerpt"),
                    author_id: row.get("author_id"),
                    author_name: row.get("author_name"),
                    status: match status_str.as_str() {
                        "draft" => crate::models::BlogStatus::Draft,
                        "published" => crate::models::BlogStatus::Published,
                        _ => crate::models::BlogStatus::Archived,
                    },
                    published_at: row.get("published_at"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                }
            }).collect();

            (StatusCode::OK, Json(json!({ "posts": posts })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch blog posts: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to fetch blog posts" })))
        }
    }
}

pub async fn update_blog_post(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(post_id): Path<String>,
    Json(payload): Json<UpdateBlogPostRequest>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let now = chrono::Utc::now().to_rfc3339();
    let mut updates = Vec::new();
    let mut values: Vec<String> = Vec::new();

    if let Some(title) = &payload.title {
        updates.push("title = ?");
        values.push(title.clone());
        updates.push("slug = ?");
        values.push(create_slug(title));
    }
    if let Some(content) = payload.content {
        updates.push("content = ?");
        values.push(content);
    }
    if let Some(excerpt) = payload.excerpt {
        updates.push("excerpt = ?");
        values.push(excerpt);
    }
    if let Some(status) = payload.status {
        let status_str = match status {
            crate::models::BlogStatus::Draft => "draft",
            crate::models::BlogStatus::Published => "published",
            crate::models::BlogStatus::Archived => "archived",
        };
        updates.push("status = ?");
        values.push(status_str.to_string());

        if matches!(status, crate::models::BlogStatus::Published) {
            updates.push("published_at = ?");
            values.push(now.clone());
        }
    }

    if updates.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({ "success": false, "error": "No updates provided" })));
    }

    updates.push("updated_at = ?");
    values.push(now);

    let query_str = format!("UPDATE blog_posts SET {} WHERE id = ?", updates.join(", "));
    let mut query = sqlx::query(&query_str);
    for value in values {
        query = query.bind(value);
    }
    query = query.bind(&post_id);

    match query.execute(&state.db).await {
        Ok(_) => (StatusCode::OK, Json(json!({ "success": true }))),
        Err(e) => {
            tracing::error!("Failed to update blog post: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to update blog post" })))
        }
    }
}

pub async fn delete_blog_post(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(post_id): Path<String>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    match sqlx::query("DELETE FROM blog_posts WHERE id = ?1").bind(&post_id).execute(&state.db).await {
        Ok(_) => (StatusCode::OK, Json(json!({ "success": true }))),
        Err(e) => {
            tracing::error!("Failed to delete blog post: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to delete blog post" })))
        }
    }
}

pub async fn get_team_members(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let rows = sqlx::query(
        "SELECT id, name, nickname, email, role, profile_picture FROM users ORDER BY role DESC, name ASC"
    )
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(rows) => {
            let members: Vec<UserInfo> = rows.iter().map(|row| {
                use sqlx::Row;
                let role_str: String = row.get("role");
                let role = match role_str.as_str() {
                    "management" => crate::models::UserRole::Management,
                    "team" => crate::models::UserRole::Team,
                    _ => crate::models::UserRole::User,
                };
                let totp_enabled_int: i32 = row.try_get("totp_enabled").unwrap_or(0);
                UserInfo {
                    id: row.get("id"),
                    name: row.get("name"),
                    nickname: row.get("nickname"),
                    email: row.get("email"),
                    role,
                    profile_picture: row.get("profile_picture"),
                    totp_enabled: totp_enabled_int != 0,
                }
            }).collect();

            (StatusCode::OK, Json(json!({ "members": members })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch team members: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to fetch team members" })))
        }
    }
}

pub async fn get_statistics(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let total_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks")
        .fetch_one(&state.db).await.unwrap_or(0);

    let completed_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE status = 'completed'")
        .fetch_one(&state.db).await.unwrap_or(0);

    let pending_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE status = 'pending'")
        .fetch_one(&state.db).await.unwrap_or(0);

    let in_progress_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE status = 'in_progress'")
        .fetch_one(&state.db).await.unwrap_or(0);

    let team_members: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE role IN ('team', 'management')")
        .fetch_one(&state.db).await.unwrap_or(0);

    let clients: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE role = 'user'")
        .fetch_one(&state.db).await.unwrap_or(0);

    let total_members = team_members + clients;

    let active_absences: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM absences WHERE status = 'approved' AND start_date <= datetime('now') AND end_date >= datetime('now')"
    )
        .fetch_one(&state.db).await.unwrap_or(0);

    let urgent_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE priority = 'urgent'")
        .fetch_one(&state.db).await.unwrap_or(0);
    let high_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE priority = 'high'")
        .fetch_one(&state.db).await.unwrap_or(0);
    let medium_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE priority = 'medium'")
        .fetch_one(&state.db).await.unwrap_or(0);
    let low_tasks: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tasks WHERE priority = 'low'")
        .fetch_one(&state.db).await.unwrap_or(0);

    let mut daily_completion: Vec<serde_json::Value> = Vec::new();
    for days_ago in (0..7).rev() {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM tasks WHERE status = 'completed' AND DATE(updated_at) = DATE('now', ?)"
        )
        .bind(format!("-{} days", days_ago))
        .fetch_one(&state.db).await.unwrap_or(0);

        daily_completion.push(json!({
            "day": format!("Day {}", 7 - days_ago),
            "completed": count
        }));
    }

    let mut daily_creation: Vec<serde_json::Value> = Vec::new();
    for days_ago in (0..7).rev() {
        let count: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM tasks WHERE DATE(created_at) = DATE('now', ?)"
        )
        .bind(format!("-{} days", days_ago))
        .fetch_one(&state.db).await.unwrap_or(0);

        daily_creation.push(json!({
            "day": format!("Day {}", 7 - days_ago),
            "created": count
        }));
    }

    let total_blog_posts: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM blog_posts")
        .fetch_one(&state.db).await.unwrap_or(0);
    let published_posts: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM blog_posts WHERE status = 'published'")
        .fetch_one(&state.db).await.unwrap_or(0);
    let draft_posts: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM blog_posts WHERE status = 'draft'")
        .fetch_one(&state.db).await.unwrap_or(0);

    let total_events: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM calendar_events")
        .fetch_one(&state.db).await.unwrap_or(0);
    let upcoming_events: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM calendar_events WHERE start_date >= datetime('now')"
    )
        .fetch_one(&state.db).await.unwrap_or(0);

    let total_tickets: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tickets")
        .fetch_one(&state.db).await.unwrap_or(0);
    let open_tickets: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tickets WHERE status = 'open'")
        .fetch_one(&state.db).await.unwrap_or(0);
    let resolved_tickets: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tickets WHERE status = 'resolved'")
        .fetch_one(&state.db).await.unwrap_or(0);

    let stats = json!({
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "in_progress_tasks": in_progress_tasks,
        "total_members": total_members,
        "team_members": team_members,
        "clients": clients,
        "active_absences": active_absences,
        "urgent_tasks": urgent_tasks,
        "high_tasks": high_tasks,
        "medium_tasks": medium_tasks,
        "low_tasks": low_tasks,
        "daily_completion": daily_completion,
        "daily_creation": daily_creation,
        "total_blog_posts": total_blog_posts,
        "published_posts": published_posts,
        "draft_posts": draft_posts,
        "total_events": total_events,
        "upcoming_events": upcoming_events,
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "resolved_tickets": resolved_tickets,
    });

    (StatusCode::OK, Json(json!({ "statistics": stats })))
}

pub async fn create_future_plan(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let plan_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let result = sqlx::query(
        "INSERT INTO future_plans (id, title, description, category, priority, status, target_date, created_by, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
    )
    .bind(&plan_id)
    .bind(payload.get("title").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(payload.get("description").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(payload.get("category").and_then(|v| v.as_str()).unwrap_or("other"))
    .bind(payload.get("priority").and_then(|v| v.as_str()).unwrap_or("medium"))
    .bind(payload.get("status").and_then(|v| v.as_str()).unwrap_or("idea"))
    .bind(payload.get("target_date").and_then(|v| v.as_str()))
    .bind(&claims.sub)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(json!({ "success": true, "plan_id": plan_id }))),
        Err(e) => {
            tracing::error!("Failed to create future plan: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to create plan" })))
        }
    }
}

pub async fn get_future_plans(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let rows = sqlx::query(
        "SELECT f.*, u.name as created_by_name FROM future_plans f
         LEFT JOIN users u ON f.created_by = u.id
         ORDER BY f.priority DESC, f.created_at DESC"
    )
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(rows) => {
            let plans: Vec<serde_json::Value> = rows.iter().map(|row| {
                use sqlx::Row;
                json!({
                    "id": row.get::<String, _>("id"),
                    "title": row.get::<String, _>("title"),
                    "description": row.get::<String, _>("description"),
                    "category": row.get::<String, _>("category"),
                    "priority": row.get::<String, _>("priority"),
                    "status": row.get::<String, _>("status"),
                    "target_date": row.get::<Option<String>, _>("target_date"),
                    "completed_at": row.get::<Option<String>, _>("completed_at"),
                    "created_by": row.get::<String, _>("created_by"),
                    "created_by_name": row.get::<String, _>("created_by_name"),
                    "created_at": row.get::<String, _>("created_at"),
                    "updated_at": row.get::<String, _>("updated_at"),
                })
            }).collect();

            (StatusCode::OK, Json(json!({ "plans": plans })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch future plans: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to fetch plans" })))
        }
    }
}

pub async fn update_future_plan(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(plan_id): Path<String>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let now = chrono::Utc::now().to_rfc3339();

    let result = if let Some(title) = payload.get("title").and_then(|v| v.as_str()) {
        sqlx::query("UPDATE future_plans SET title = ?, updated_at = ? WHERE id = ?")
            .bind(title).bind(&now).bind(&plan_id)
            .execute(&state.db)
            .await
    } else if let Some(status) = payload.get("status").and_then(|v| v.as_str()) {
        let completed_at = if status == "completed" { Some(now.clone()) } else { None };
        sqlx::query("UPDATE future_plans SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?")
            .bind(status).bind(completed_at).bind(&now).bind(&plan_id)
            .execute(&state.db)
            .await
    } else {
        sqlx::query("UPDATE future_plans SET updated_at = ? WHERE id = ?")
            .bind(&now).bind(&plan_id)
            .execute(&state.db)
            .await
    };

    match result {
        Ok(_) => (StatusCode::OK, Json(json!({ "success": true }))),
        Err(e) => {
            tracing::error!("Failed to update future plan: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to update plan" })))
        }
    }
}

pub async fn delete_future_plan(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(plan_id): Path<String>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    match sqlx::query("DELETE FROM future_plans WHERE id = ?1").bind(&plan_id).execute(&state.db).await {
        Ok(_) => (StatusCode::OK, Json(json!({ "success": true }))),
        Err(e) => {
            tracing::error!("Failed to delete future plan: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to delete plan" })))
        }
    }
}

pub async fn create_schedule(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let schedule_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let result = sqlx::query(
        "INSERT INTO schedules (id, user_id, title, description, schedule_type, start_time, end_time, created_by, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
    )
    .bind(&schedule_id)
    .bind(payload.get("user_id").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(payload.get("title").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(payload.get("description").and_then(|v| v.as_str()))
    .bind(payload.get("schedule_type").and_then(|v| v.as_str()).unwrap_or("other"))
    .bind(payload.get("start_time").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(payload.get("end_time").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(&claims.sub)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(json!({ "success": true, "schedule_id": schedule_id }))),
        Err(e) => {
            tracing::error!("Failed to create schedule: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to create schedule" })))
        }
    }
}

pub async fn get_schedules(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let rows = sqlx::query(
        "SELECT s.*, u1.name as user_name, u2.name as created_by_name FROM schedules s
         LEFT JOIN users u1 ON s.user_id = u1.id
         LEFT JOIN users u2 ON s.created_by = u2.id
         ORDER BY s.start_time ASC"
    )
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(rows) => {
            let schedules: Vec<serde_json::Value> = rows.iter().map(|row| {
                use sqlx::Row;
                json!({
                    "id": row.get::<String, _>("id"),
                    "user_id": row.get::<String, _>("user_id"),
                    "user_name": row.get::<String, _>("user_name"),
                    "title": row.get::<String, _>("title"),
                    "description": row.get::<Option<String>, _>("description"),
                    "schedule_type": row.get::<String, _>("schedule_type"),
                    "start_time": row.get::<String, _>("start_time"),
                    "end_time": row.get::<String, _>("end_time"),
                    "created_by": row.get::<String, _>("created_by"),
                    "created_by_name": row.get::<String, _>("created_by_name"),
                    "created_at": row.get::<String, _>("created_at"),
                })
            }).collect();

            (StatusCode::OK, Json(json!({ "schedules": schedules })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch schedules: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to fetch schedules" })))
        }
    }
}

pub async fn create_calendar_event(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let event_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let result = sqlx::query(
        "INSERT INTO calendar_events (id, title, description, event_type, start_date, end_date, all_day, created_by, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
    )
    .bind(&event_id)
    .bind(payload.get("title").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(payload.get("description").and_then(|v| v.as_str()))
    .bind(payload.get("event_type").and_then(|v| v.as_str()).unwrap_or("other"))
    .bind(payload.get("start_date").and_then(|v| v.as_str()).unwrap_or(""))
    .bind(payload.get("end_date").and_then(|v| v.as_str()))
    .bind(payload.get("all_day").and_then(|v| v.as_bool()).unwrap_or(false))
    .bind(&claims.sub)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => (StatusCode::CREATED, Json(json!({ "success": true, "event_id": event_id }))),
        Err(e) => {
            tracing::error!("Failed to create calendar event: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to create event" })))
        }
    }
}

pub async fn get_calendar_events(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({ "success": false, "error": "Access denied" })));
    }

    let rows = sqlx::query(
        "SELECT c.*, u.name as created_by_name FROM calendar_events c
         LEFT JOIN users u ON c.created_by = u.id
         ORDER BY c.start_date ASC"
    )
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(rows) => {
            let events: Vec<serde_json::Value> = rows.iter().map(|row| {
                use sqlx::Row;
                json!({
                    "id": row.get::<String, _>("id"),
                    "title": row.get::<String, _>("title"),
                    "description": row.get::<Option<String>, _>("description"),
                    "event_type": row.get::<String, _>("event_type"),
                    "start_date": row.get::<String, _>("start_date"),
                    "end_date": row.get::<Option<String>, _>("end_date"),
                    "all_day": row.get::<bool, _>("all_day"),
                    "created_by": row.get::<String, _>("created_by"),
                    "created_by_name": row.get::<String, _>("created_by_name"),
                    "created_at": row.get::<String, _>("created_at"),
                })
            }).collect();

            (StatusCode::OK, Json(json!({ "events": events })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch calendar events: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "success": false, "error": "Failed to fetch events" })))
        }
    }
}
