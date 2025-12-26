use axum::{
    Extension,
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Json},
};
use serde_json::json;
use uuid::Uuid;
use validator::Validate;

use crate::AppState;
use crate::models::{
    Claims, CreateServiceRequest, Service, ServiceStatistics, UpdateServiceRequest, UserRole,
};

pub async fn create_service(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<CreateServiceRequest>,
) -> impl IntoResponse {
    // Only team members can create services
    if !matches!(claims.role, UserRole::Team | UserRole::Management) {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "success": false,
                "error": "Only team members can create services"
            })),
        );
    }

    if let Err(errors) = req.validate() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "success": false,
                "error": format!("Validation failed: {:?}", errors)
            })),
        );
    }

    let service_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let status = req.status.unwrap_or_else(|| "active".to_string());
    let progress = req.progress.unwrap_or(0);

    let result = sqlx::query(
        r#"
        INSERT INTO services (id, user_id, name, description, service_type, price, status, start_date, end_date, progress, notes, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&service_id)
    .bind(&req.user_id)
    .bind(&req.name)
    .bind(&req.description)
    .bind(&req.service_type)
    .bind(req.price)
    .bind(&status)
    .bind(&req.start_date)
    .bind(&req.end_date)
    .bind(progress)
    .bind(&req.notes)
    .bind(&claims.sub)
    .bind(&now)
    .bind(&now)
    .execute(&state.db)
    .await;

    match result {
        Ok(_) => (
            StatusCode::CREATED,
            Json(json!({
                "success": true,
                "service_id": service_id
            })),
        ),
        Err(e) => {
            tracing::error!("Failed to create service: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to create service"
                })),
            )
        }
    }
}

pub async fn get_all_services(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    if !matches!(claims.role, UserRole::Team | UserRole::Management) {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "success": false,
                "error": "Only team members or management can update services"
            })),
        );
    }

    let result = sqlx::query_as::<_, Service>(
        r#"
        SELECT
            s.id,
            s.user_id,
            u.name as user_name,
            s.name,
            s.description,
            s.service_type,
            s.price,
            s.status,
            s.start_date,
            s.end_date,
            s.progress,
            s.notes,
            s.created_by,
            creator.name as created_by_name,
            s.created_at,
            s.updated_at
        FROM services s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN users creator ON s.created_by = creator.id
        ORDER BY s.created_at DESC
        "#,
    )
    .fetch_all(&state.db)
    .await;

    match result {
        Ok(services) => (
            StatusCode::OK,
            Json(json!({
                "success": true,
                "services": services
            })),
        ),
        Err(e) => {
            tracing::error!("Failed to fetch services: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to fetch services"
                })),
            )
        }
    }
}

pub async fn get_my_services(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    let result = sqlx::query_as::<_, Service>(
        r#"
        SELECT
            s.id,
            s.user_id,
            u.name as user_name,
            s.name,
            s.description,
            s.service_type,
            s.price,
            s.status,
            s.start_date,
            s.end_date,
            s.progress,
            s.notes,
            s.created_by,
            creator.name as created_by_name,
            s.created_at,
            s.updated_at
        FROM services s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN users creator ON s.created_by = creator.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
        "#,
    )
    .bind(&claims.sub)
    .fetch_all(&state.db)
    .await;

    match result {
        Ok(services) => (
            StatusCode::OK,
            Json(json!({
                "success": true,
                "services": services
            })),
        ),
        Err(e) => {
            tracing::error!("Failed to fetch my services: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to fetch services"
                })),
            )
        }
    }
}

pub async fn get_service_statistics(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    let stats_result = sqlx::query_as::<_, (i64, i64, i64, i64, f64, f64)>(
        r#"
        SELECT
            COUNT(*) as total_services,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_services,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_services,
            SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused_services,
            SUM(price) as total_value,
            SUM(CASE WHEN status = 'active' THEN price ELSE 0 END) as active_value
        FROM services
        WHERE user_id = ?
        "#,
    )
    .bind(&claims.sub)
    .fetch_one(&state.db)
    .await;

    match stats_result {
        Ok((total, active, completed, paused, total_value, active_value)) => {
            let stats = ServiceStatistics {
                total_services: total,
                active_services: active,
                completed_services: completed,
                paused_services: paused,
                total_value,
                active_value,
            };

            (
                StatusCode::OK,
                Json(json!({
                    "success": true,
                    "statistics": stats
                })),
            )
        }
        Err(e) => {
            tracing::error!("Failed to fetch service statistics: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to fetch statistics"
                })),
            )
        }
    }
}

pub async fn update_service(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(service_id): Path<String>,
    Json(req): Json<UpdateServiceRequest>,
) -> impl IntoResponse {
    if !matches!(claims.role, UserRole::Team | UserRole::Management) {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "success": false,
                "error": "Only team members can update services"
            })),
        );
    }

    if let Err(errors) = req.validate() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "success": false,
                "error": format!("Validation failed: {:?}", errors)
            })),
        );
    }

    let now = chrono::Utc::now().to_rfc3339();

    let mut query = String::from("UPDATE services SET updated_at = ?");
    let mut params: Vec<String> = vec![now.clone()];

    if let Some(name) = &req.name {
        query.push_str(", name = ?");
        params.push(name.clone());
    }
    if let Some(description) = &req.description {
        query.push_str(", description = ?");
        params.push(description.clone());
    }
    if let Some(service_type) = &req.service_type {
        query.push_str(", service_type = ?");
        params.push(service_type.clone());
    }
    if let Some(price) = req.price {
        query.push_str(", price = ?");
        params.push(price.to_string());
    }
    if let Some(status) = &req.status {
        query.push_str(", status = ?");
        params.push(status.clone());
    }
    if let Some(start_date) = &req.start_date {
        query.push_str(", start_date = ?");
        params.push(start_date.clone());
    }
    if let Some(end_date) = &req.end_date {
        query.push_str(", end_date = ?");
        params.push(end_date.clone());
    }
    if let Some(progress) = req.progress {
        query.push_str(", progress = ?");
        params.push(progress.to_string());
    }
    if let Some(notes) = &req.notes {
        query.push_str(", notes = ?");
        params.push(notes.clone());
    }

    query.push_str(" WHERE id = ?");
    params.push(service_id.clone());

    let mut sql_query = sqlx::query(&query).bind(&now);

    if let Some(name) = &req.name {
        sql_query = sql_query.bind(name);
    }
    if let Some(description) = &req.description {
        sql_query = sql_query.bind(description);
    }
    if let Some(service_type) = &req.service_type {
        sql_query = sql_query.bind(service_type);
    }
    if let Some(price) = req.price {
        sql_query = sql_query.bind(price);
    }
    if let Some(status) = &req.status {
        sql_query = sql_query.bind(status);
    }
    if let Some(start_date) = &req.start_date {
        sql_query = sql_query.bind(start_date);
    }
    if let Some(end_date) = &req.end_date {
        sql_query = sql_query.bind(end_date);
    }
    if let Some(progress) = req.progress {
        sql_query = sql_query.bind(progress);
    }
    if let Some(notes) = &req.notes {
        sql_query = sql_query.bind(notes);
    }

    sql_query = sql_query.bind(&service_id);

    let result = sql_query.execute(&state.db).await;

    match result {
        Ok(res) => {
            if res.rows_affected() == 0 {
                (
                    StatusCode::NOT_FOUND,
                    Json(json!({
                        "success": false,
                        "error": "Service not found"
                    })),
                )
            } else {
                (
                    StatusCode::OK,
                    Json(json!({
                        "success": true,
                        "message": "Service updated successfully"
                    })),
                )
            }
        }
        Err(e) => {
            tracing::error!("Failed to update service: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to update service"
                })),
            )
        }
    }
}

pub async fn delete_service(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(service_id): Path<String>,
) -> impl IntoResponse {
    if !matches!(claims.role, UserRole::Team | UserRole::Management) {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "success": false,
                "error": "Only team members or management can delete services"
            })),
        );
    }

    let result = sqlx::query("DELETE FROM services WHERE id = ?")
        .bind(&service_id)
        .execute(&state.db)
        .await;

    match result {
        Ok(res) => {
            if res.rows_affected() == 0 {
                (
                    StatusCode::NOT_FOUND,
                    Json(json!({
                        "success": false,
                        "error": "Service not found"
                    })),
                )
            } else {
                (
                    StatusCode::OK,
                    Json(json!({
                        "success": true,
                        "message": "Service deleted successfully"
                    })),
                )
            }
        }
        Err(e) => {
            tracing::error!("Failed to delete service: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "error": "Failed to delete service"
                })),
            )
        }
    }
}
