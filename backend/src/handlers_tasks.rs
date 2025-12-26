use axum::{
    Extension,
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json},
};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::{
    AppState,
    models::{
        Claims, CreateCommentRequest, CreateTaskRequest, Task, TaskComment, UpdateTaskRequest,
    },
};

#[derive(Debug, Deserialize)]
pub struct TaskFilters {
    status: Option<String>,
    assigned_to: Option<String>,
}

pub async fn create_task(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateTaskRequest>,
) -> impl IntoResponse {
    if !matches!(
        claims.role,
        crate::models::UserRole::Team | crate::models::UserRole::Management
    ) {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "success": false,
                "error": "Access denied"
            })),
        );
    }

    if payload.assigned_to.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "success": false,
                "error": "At least one user must be assigned"
            })),
        );
    }

    let task_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let priority_str = match payload.priority {
        crate::models::TaskPriority::Low => "low",
        crate::models::TaskPriority::Medium => "medium",
        crate::models::TaskPriority::High => "high",
        crate::models::TaskPriority::Urgent => "urgent",
    };

    // Start transaction
    let mut tx = match state.db.begin().await {
        Ok(tx) => tx,
        Err(e) => {
            tracing::error!("Failed to start transaction: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to create task"
                })),
            );
        }
    };

    // Create task
    let result = sqlx::query(
        "INSERT INTO tasks (id, title, description, assigned_to, created_by, priority, status, due_date, created_at, updated_at)
         VALUES (?1, ?2, ?3, NULL, ?4, ?5, 'pending', ?6, ?7, ?8)"
    )
    .bind(&task_id)
    .bind(&payload.title)
    .bind(&payload.description)
    .bind(&claims.sub)
    .bind(priority_str)
    .bind(&payload.due_date)
    .bind(&now)
    .bind(&now)
    .execute(&mut *tx)
    .await;

    if let Err(e) = result {
        tracing::error!("Failed to create task: {}", e);
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "success": false,
                "error": "Failed to create task"
            })),
        );
    }

    // Create task assignments
    for user_id in &payload.assigned_to {
        let assignment_id = Uuid::new_v4().to_string();
        let result = sqlx::query(
            "INSERT INTO task_assignments (id, task_id, user_id, created_at)
             VALUES (?1, ?2, ?3, ?4)",
        )
        .bind(&assignment_id)
        .bind(&task_id)
        .bind(user_id)
        .bind(&now)
        .execute(&mut *tx)
        .await;

        if let Err(e) = result {
            tracing::error!("Failed to create task assignment: {}", e);
            let _ = tx.rollback().await;
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to assign task to users"
                })),
            );
        }
    }

    // Commit transaction
    match tx.commit().await {
        Ok(_) => {
            tracing::info!(
                "Task created: {} by {} with {} assignments",
                task_id,
                claims.email,
                payload.assigned_to.len()
            );
            (
                StatusCode::CREATED,
                Json(json!({
                    "success": true,
                    "task_id": task_id
                })),
            )
        }
        Err(e) => {
            tracing::error!("Failed to commit transaction: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to create task"
                })),
            )
        }
    }
}

pub async fn get_tasks(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(filters): Query<TaskFilters>,
) -> impl IntoResponse {
    if !matches!(
        claims.role,
        crate::models::UserRole::Team | crate::models::UserRole::Management
    ) {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "success": false,
                "error": "Access denied"
            })),
        );
    }

    let query_str = "SELECT t.id, t.title, t.description, t.assigned_to, t.created_by, t.priority, t.status, t.due_date, t.completed_at, t.created_at, t.updated_at,
        GROUP_CONCAT(u_assigned.id, '||') as assigned_user_ids,
        GROUP_CONCAT(u_assigned.name, '||') as assigned_user_names,
        u_creator.name as created_by_name
        FROM tasks t
        LEFT JOIN task_assignments ta ON t.id = ta.task_id
        LEFT JOIN users u_assigned ON ta.user_id = u_assigned.id
        LEFT JOIN users u_creator ON t.created_by = u_creator.id
        WHERE 1=1";

    let mut query_builder = sqlx::QueryBuilder::new(query_str);

    if let Some(status) = &filters.status {
        query_builder.push(" AND t.status = ");
        query_builder.push_bind(status);
    }

    if let Some(assigned_to) = &filters.assigned_to {
        query_builder.push(" AND ta.user_id = ");
        query_builder.push_bind(assigned_to);
    }

    query_builder.push(" GROUP BY t.id ORDER BY t.created_at DESC");

    let rows = query_builder.build().fetch_all(&state.db).await;

    match rows {
        Ok(rows) => {
            let tasks: Vec<Task> = rows
                .iter()
                .map(|row| {
                    use sqlx::Row;
                    let priority_str: String = row.get("priority");
                    let status_str: String = row.get("status");

                    let assigned_user_ids: Option<String> = row.get("assigned_user_ids");
                    let assigned_user_names: Option<String> = row.get("assigned_user_names");

                    let assigned_users = if let (Some(ids), Some(names)) =
                        (assigned_user_ids, assigned_user_names)
                    {
                        let id_vec: Vec<&str> = ids.split("||").collect();
                        let name_vec: Vec<&str> = names.split("||").collect();

                        id_vec
                            .iter()
                            .zip(name_vec.iter())
                            .map(|(id, name)| crate::models::AssignedUser {
                                id: id.to_string(),
                                name: name.to_string(),
                            })
                            .collect()
                    } else {
                        Vec::new()
                    };

                    Task {
                        id: row.get("id"),
                        title: row.get("title"),
                        description: row.get("description"),
                        assigned_to: row.get("assigned_to"),
                        assigned_users,
                        created_by: row.get("created_by"),
                        created_by_name: row.get("created_by_name"),
                        priority: match priority_str.as_str() {
                            "low" => crate::models::TaskPriority::Low,
                            "medium" => crate::models::TaskPriority::Medium,
                            "high" => crate::models::TaskPriority::High,
                            _ => crate::models::TaskPriority::Urgent,
                        },
                        status: match status_str.as_str() {
                            "pending" => crate::models::TaskStatus::Pending,
                            "in_progress" => crate::models::TaskStatus::InProgress,
                            "completed" => crate::models::TaskStatus::Completed,
                            _ => crate::models::TaskStatus::Cancelled,
                        },
                        due_date: row.get("due_date"),
                        completed_at: row.get("completed_at"),
                        created_at: row.get("created_at"),
                        updated_at: row.get("updated_at"),
                    }
                })
                .collect();

            (StatusCode::OK, Json(json!({ "tasks": tasks })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch tasks: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to fetch tasks"
                })),
            )
        }
    }
}

pub async fn get_my_tasks(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    if !matches!(
        claims.role,
        crate::models::UserRole::Team | crate::models::UserRole::Management
    ) {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "success": false,
                "error": "Access denied"
            })),
        );
    }

    let rows = sqlx::query(
        "SELECT t.id, t.title, t.description, t.assigned_to, t.created_by, t.priority, t.status, t.due_date, t.completed_at, t.created_at, t.updated_at,
         GROUP_CONCAT(u_assigned.id, '||') as assigned_user_ids,
         GROUP_CONCAT(u_assigned.name, '||') as assigned_user_names,
         u_creator.name as created_by_name
         FROM tasks t
         LEFT JOIN task_assignments ta ON t.id = ta.task_id
         LEFT JOIN users u_assigned ON ta.user_id = u_assigned.id
         LEFT JOIN users u_creator ON t.created_by = u_creator.id
         WHERE ta.user_id = ?1
         GROUP BY t.id
         ORDER BY t.created_at DESC"
    )
    .bind(&claims.sub)
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(rows) => {
            let tasks: Vec<Task> = rows
                .iter()
                .map(|row| {
                    use sqlx::Row;
                    let priority_str: String = row.get("priority");
                    let status_str: String = row.get("status");

                    let assigned_user_ids: Option<String> = row.get("assigned_user_ids");
                    let assigned_user_names: Option<String> = row.get("assigned_user_names");

                    let assigned_users = if let (Some(ids), Some(names)) =
                        (assigned_user_ids, assigned_user_names)
                    {
                        let id_vec: Vec<&str> = ids.split("||").collect();
                        let name_vec: Vec<&str> = names.split("||").collect();

                        id_vec
                            .iter()
                            .zip(name_vec.iter())
                            .map(|(id, name)| crate::models::AssignedUser {
                                id: id.to_string(),
                                name: name.to_string(),
                            })
                            .collect()
                    } else {
                        Vec::new()
                    };

                    Task {
                        id: row.get("id"),
                        title: row.get("title"),
                        description: row.get("description"),
                        assigned_to: row.get("assigned_to"),
                        assigned_users,
                        created_by: row.get("created_by"),
                        created_by_name: row.get("created_by_name"),
                        priority: match priority_str.as_str() {
                            "low" => crate::models::TaskPriority::Low,
                            "medium" => crate::models::TaskPriority::Medium,
                            "high" => crate::models::TaskPriority::High,
                            _ => crate::models::TaskPriority::Urgent,
                        },
                        status: match status_str.as_str() {
                            "pending" => crate::models::TaskStatus::Pending,
                            "in_progress" => crate::models::TaskStatus::InProgress,
                            "completed" => crate::models::TaskStatus::Completed,
                            _ => crate::models::TaskStatus::Cancelled,
                        },
                        due_date: row.get("due_date"),
                        completed_at: row.get("completed_at"),
                        created_at: row.get("created_at"),
                        updated_at: row.get("updated_at"),
                    }
                })
                .collect();

            (StatusCode::OK, Json(json!({ "tasks": tasks })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch tasks: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to fetch tasks"
                })),
            )
        }
    }
}

pub async fn update_task(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(task_id): Path<String>,
    Json(payload): Json<UpdateTaskRequest>,
) -> impl IntoResponse {
    if !matches!(
        claims.role,
        crate::models::UserRole::Team | crate::models::UserRole::Management
    ) {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "success": false,
                "error": "Access denied"
            })),
        );
    }

    // Check if user is assigned to this task
    let is_assigned = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM task_assignments WHERE task_id = ?1 AND user_id = ?2",
    )
    .bind(&task_id)
    .bind(&claims.sub)
    .fetch_one(&state.db)
    .await;

    match is_assigned {
        Ok(0) => {
            return (
                StatusCode::FORBIDDEN,
                Json(json!({
                    "success": false,
                    "error": "You are not assigned to this task"
                })),
            );
        }
        Err(e) => {
            tracing::error!("Failed to check task assignment: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to verify task assignment"
                })),
            );
        }
        _ => {}
    }

    let now = chrono::Utc::now().to_rfc3339();
    let mut updates = Vec::new();
    let mut values: Vec<String> = Vec::new();

    if let Some(status) = payload.status {
        let status_str = match status {
            crate::models::TaskStatus::Pending => "pending",
            crate::models::TaskStatus::InProgress => "in_progress",
            crate::models::TaskStatus::Completed => "completed",
            crate::models::TaskStatus::Cancelled => "cancelled",
        };
        updates.push("status = ?".to_string());
        values.push(status_str.to_string());

        if matches!(status, crate::models::TaskStatus::Completed) {
            updates.push("completed_at = ?".to_string());
            values.push(now.clone());
        }
    }

    if let Some(priority) = payload.priority {
        let priority_str = match priority {
            crate::models::TaskPriority::Low => "low",
            crate::models::TaskPriority::Medium => "medium",
            crate::models::TaskPriority::High => "high",
            crate::models::TaskPriority::Urgent => "urgent",
        };
        updates.push("priority = ?".to_string());
        values.push(priority_str.to_string());
    }

    if let Some(due_date) = payload.due_date {
        updates.push("due_date = ?".to_string());
        values.push(due_date);
    }

    if updates.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "success": false,
                "error": "No updates provided"
            })),
        );
    }

    updates.push("updated_at = ?".to_string());
    values.push(now);

    let query_str = format!("UPDATE tasks SET {} WHERE id = ?", updates.join(", "));
    let mut query = sqlx::query(&query_str);

    for value in values {
        query = query.bind(value);
    }
    query = query.bind(&task_id);

    match query.execute(&state.db).await {
        Ok(_) => {
            tracing::info!("Task updated: {} by {}", task_id, claims.email);
            (
                StatusCode::OK,
                Json(json!({
                    "success": true
                })),
            )
        }
        Err(e) => {
            tracing::error!("Failed to update task: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to update task"
                })),
            )
        }
    }
}

pub async fn add_task_comment(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(task_id): Path<String>,
    Json(payload): Json<CreateCommentRequest>,
) -> impl IntoResponse {
    if !matches!(
        claims.role,
        crate::models::UserRole::Team | crate::models::UserRole::Management
    ) {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "success": false,
                "error": "Access denied"
            })),
        );
    }

    let comment_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let result = sqlx::query(
        "INSERT INTO task_comments (id, task_id, user_id, comment, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
    )
    .bind(&comment_id)
    .bind(&task_id)
    .bind(&claims.sub)
    .bind(&payload.comment)
    .bind(&now)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => {
            tracing::info!("Comment added to task {} by {}", task_id, claims.email);
            (
                StatusCode::CREATED,
                Json(json!({
                    "success": true,
                    "comment_id": comment_id
                })),
            )
        }
        Err(e) => {
            tracing::error!("Failed to add comment: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to add comment"
                })),
            )
        }
    }
}

pub async fn get_task_comments(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(task_id): Path<String>,
) -> impl IntoResponse {
    if !matches!(
        claims.role,
        crate::models::UserRole::Team | crate::models::UserRole::Management
    ) {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "success": false,
                "error": "Access denied"
            })),
        );
    }

    let rows = sqlx::query(
        "SELECT tc.id, tc.task_id, tc.user_id, tc.comment, tc.created_at, u.name as user_name
         FROM task_comments tc
         LEFT JOIN users u ON tc.user_id = u.id
         WHERE tc.task_id = ?1
         ORDER BY tc.created_at ASC",
    )
    .bind(&task_id)
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(rows) => {
            let comments: Vec<TaskComment> = rows
                .iter()
                .map(|row| {
                    use sqlx::Row;
                    TaskComment {
                        id: row.get("id"),
                        task_id: row.get("task_id"),
                        user_id: row.get("user_id"),
                        user_name: row.get("user_name"),
                        comment: row.get("comment"),
                        created_at: row.get("created_at"),
                    }
                })
                .collect();

            (StatusCode::OK, Json(json!({ "comments": comments })))
        }
        Err(e) => {
            tracing::error!("Failed to fetch comments: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to fetch comments"
                })),
            )
        }
    }
}
