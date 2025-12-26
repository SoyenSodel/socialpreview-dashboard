use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Json},
    Extension,
};
use serde_json::json;
use uuid::Uuid;

use crate::{
    models::{Claims, CreateTicketRequest, CreateCommentRequest, UpdateTicketRequest, Ticket, TicketComment},
    AppState,
};

pub async fn create_ticket(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateTicketRequest>,
) -> impl IntoResponse {
    let ticket_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let priority_str = match payload.priority {
        crate::models::TicketPriority::Low => "low",
        crate::models::TicketPriority::Medium => "medium",
        crate::models::TicketPriority::High => "high",
        crate::models::TicketPriority::Urgent => "urgent",
    };

    let result = sqlx::query(
        "INSERT INTO tickets (id, user_id, title, description, priority, status, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 'open', ?6, ?7)"
    )
    .bind(&ticket_id)
    .bind(&claims.sub)
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(priority_str)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => {
            tracing::info!("Ticket created: {} by user {}", ticket_id, claims.email);
            (StatusCode::CREATED, Json(json!({
                "success": true,
                "ticket_id": ticket_id
            })))
        }
        Err(e) => {
            tracing::error!("Failed to create ticket: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
                "success": false,
                "error": "Failed to create ticket"
            })))
        }
    }
}

pub async fn get_ticket_by_id(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(ticket_id): Path<String>,
) -> impl IntoResponse {
    let row = sqlx::query(
        "SELECT t.id, t.user_id, t.title, t.description, t.priority, t.status, t.assigned_to,
                t.created_at, t.updated_at, t.resolved_at, u.name as user_name
         FROM tickets t
         LEFT JOIN users u ON t.user_id = u.id
         WHERE t.id = ?1"
    )
    .bind(&ticket_id)
    .fetch_optional(&state.db)
    .await;

    match row {
        Ok(Some(row)) => {
            use sqlx::Row;

            let ticket_user_id: String = row.get("user_id");
            if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) && claims.sub != ticket_user_id {
                return (StatusCode::FORBIDDEN, Json(json!({
                    "success": false,
                    "error": "Access denied"
                })));
            }

            let priority_str: String = row.get("priority");
            let status_str: String = row.get("status");

            let ticket = json!({
                "id": row.get::<String, _>("id"),
                "user_id": row.get::<String, _>("user_id"),
                "user_name": row.get::<String, _>("user_name"),
                "title": row.get::<String, _>("title"),
                "description": row.get::<String, _>("description"),
                "priority": priority_str,
                "status": status_str,
                "assigned_to": row.get::<Option<String>, _>("assigned_to"),
                "created_at": row.get::<String, _>("created_at"),
                "updated_at": row.get::<String, _>("updated_at"),
                "resolved_at": row.get::<Option<String>, _>("resolved_at"),
            });

            (StatusCode::OK, Json(json!({ "ticket": ticket })))
        }
        Ok(None) => {
            (StatusCode::NOT_FOUND, Json(json!({
                "success": false,
                "error": "Ticket not found"
            })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch ticket: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
                "success": false,
                "error": "Failed to fetch ticket"
            })))
        }
    }
}

pub async fn get_my_tickets(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    let rows = sqlx::query(
        "SELECT id, user_id, title, description, priority, status, assigned_to, created_at, updated_at, resolved_at
         FROM tickets WHERE user_id = ?1 ORDER BY created_at DESC"
    )
    .bind(&claims.sub)
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(rows) => {
            let tickets: Vec<Ticket> = rows.iter().map(|row| {
                use sqlx::Row;
                let priority_str: String = row.get("priority");
                let status_str: String = row.get("status");

                Ticket {
                    id: row.get("id"),
                    user_id: row.get("user_id"),
                    title: row.get("title"),
                    description: row.get("description"),
                    priority: match priority_str.as_str() {
                        "low" => crate::models::TicketPriority::Low,
                        "medium" => crate::models::TicketPriority::Medium,
                        "high" => crate::models::TicketPriority::High,
                        _ => crate::models::TicketPriority::Urgent,
                    },
                    status: match status_str.as_str() {
                        "open" => crate::models::TicketStatus::Open,
                        "in_progress" => crate::models::TicketStatus::InProgress,
                        "resolved" => crate::models::TicketStatus::Resolved,
                        _ => crate::models::TicketStatus::Closed,
                    },
                    assigned_to: row.get("assigned_to"),
                    created_at: row.get("created_at"),
                    updated_at: row.get("updated_at"),
                    resolved_at: row.get("resolved_at"),
                }
            }).collect();

            (StatusCode::OK, Json(json!({ "tickets": tickets })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch tickets: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
                "success": false,
                "error": "Failed to fetch tickets"
            })))
        }
    }
}

pub async fn get_all_tickets(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({
            "success": false,
            "error": "Access denied"
        })));
    }

    let rows = sqlx::query(
        "SELECT t.id, t.user_id, t.title, t.description, t.priority, t.status, t.assigned_to,
                t.created_at, t.updated_at, t.resolved_at, u.name as user_name
         FROM tickets t
         LEFT JOIN users u ON t.user_id = u.id
         ORDER BY t.created_at DESC"
    )
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(rows) => {
            let tickets: Vec<serde_json::Value> = rows.iter().map(|row| {
                use sqlx::Row;
                let priority_str: String = row.get("priority");
                let status_str: String = row.get("status");

                json!({
                    "id": row.get::<String, _>("id"),
                    "user_id": row.get::<String, _>("user_id"),
                    "user_name": row.get::<String, _>("user_name"),
                    "title": row.get::<String, _>("title"),
                    "description": row.get::<String, _>("description"),
                    "priority": priority_str,
                    "status": status_str,
                    "assigned_to": row.get::<Option<String>, _>("assigned_to"),
                    "created_at": row.get::<String, _>("created_at"),
                    "updated_at": row.get::<String, _>("updated_at"),
                    "resolved_at": row.get::<Option<String>, _>("resolved_at"),
                })
            }).collect();

            (StatusCode::OK, Json(json!({ "tickets": tickets })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch tickets: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
                "success": false,
                "error": "Failed to fetch tickets"
            })))
        }
    }
}

pub async fn update_ticket(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(ticket_id): Path<String>,
    Json(payload): Json<UpdateTicketRequest>,
) -> impl IntoResponse {
    if !matches!(claims.role, crate::models::UserRole::Team | crate::models::UserRole::Management) {
        return (StatusCode::FORBIDDEN, Json(json!({
            "success": false,
            "error": "Access denied"
        })));
    }

    let now = chrono::Utc::now().to_rfc3339();
    let mut updates = Vec::new();
    let mut values: Vec<String> = Vec::new();

    if let Some(status) = payload.status {
        let status_str = match status {
            crate::models::TicketStatus::Open => "open",
            crate::models::TicketStatus::InProgress => "in_progress",
            crate::models::TicketStatus::Resolved => "resolved",
            crate::models::TicketStatus::Closed => "closed",
        };
        updates.push("status = ?".to_string());
        values.push(status_str.to_string());

        if matches!(status, crate::models::TicketStatus::Resolved) {
            updates.push("resolved_at = ?".to_string());
            values.push(now.clone());
        }
    }

    if let Some(assigned_to) = payload.assigned_to {
        updates.push("assigned_to = ?".to_string());
        values.push(assigned_to);
    }

    if let Some(priority) = payload.priority {
        let priority_str = match priority {
            crate::models::TicketPriority::Low => "low",
            crate::models::TicketPriority::Medium => "medium",
            crate::models::TicketPriority::High => "high",
            crate::models::TicketPriority::Urgent => "urgent",
        };
        updates.push("priority = ?".to_string());
        values.push(priority_str.to_string());
    }

    if updates.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(json!({
            "success": false,
            "error": "No updates provided"
        })));
    }

    updates.push("updated_at = ?".to_string());
    values.push(now);

    let query_str = format!("UPDATE tickets SET {} WHERE id = ?", updates.join(", "));
    let mut query = sqlx::query(&query_str);

    for value in values {
        query = query.bind(value);
    }
    query = query.bind(&ticket_id);

    match query.execute(&state.db).await {
        Ok(_) => {
            tracing::info!("Ticket updated: {} by {}", ticket_id, claims.email);
            (StatusCode::OK, Json(json!({
                "success": true
            })))
        }
        Err(e) => {
            tracing::error!("Failed to update ticket: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
                "success": false,
                "error": "Failed to update ticket"
            })))
        }
    }
}

pub async fn add_ticket_comment(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(ticket_id): Path<String>,
    Json(payload): Json<CreateCommentRequest>,
) -> impl IntoResponse {
    let comment_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let result = sqlx::query(
        "INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)"
    )
    .bind(&comment_id)
    .bind(&ticket_id)
    .bind(&claims.sub)
    .bind(&payload.comment)
    .bind(&now)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => {
            tracing::info!("Comment added to ticket {} by {}", ticket_id, claims.email);
            (StatusCode::CREATED, Json(json!({
                "success": true,
                "comment_id": comment_id
            })))
        }
        Err(e) => {
            tracing::error!("Failed to add comment: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
                "success": false,
                "error": "Failed to add comment"
            })))
        }
    }
}

pub async fn get_ticket_comments(
    State(state): State<AppState>,
    Extension(_claims): Extension<Claims>,
    Path(ticket_id): Path<String>,
) -> impl IntoResponse {
    let rows = sqlx::query(
        "SELECT tc.id, tc.ticket_id, tc.user_id, tc.comment, tc.created_at, u.name as user_name
         FROM ticket_comments tc
         LEFT JOIN users u ON tc.user_id = u.id
         WHERE tc.ticket_id = ?1
         ORDER BY tc.created_at ASC"
    )
    .bind(&ticket_id)
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(rows) => {
            let comments: Vec<TicketComment> = rows.iter().map(|row| {
                use sqlx::Row;
                TicketComment {
                    id: row.get("id"),
                    ticket_id: row.get("ticket_id"),
                    user_id: row.get("user_id"),
                    user_name: row.get("user_name"),
                    comment: row.get("comment"),
                    created_at: row.get("created_at"),
                }
            }).collect();

            (StatusCode::OK, Json(json!({ "comments": comments })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch comments: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({
                "success": false,
                "error": "Failed to fetch comments"
            })))
        }
    }
}
