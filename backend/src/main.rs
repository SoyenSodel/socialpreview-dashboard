mod auth;
mod database;
mod handlers_2fa;
mod handlers_features;
mod handlers_services;
mod handlers_tasks;
mod handlers_tickets;
mod middleware;
mod models;
mod totp;

#[cfg(test)]
mod tests_auth;

use axum::{
    Extension, Router,
    extract::{DefaultBodyLimit, Multipart, Path, State},
    http::{Method, StatusCode, header},
    middleware as axum_middleware,
    response::{IntoResponse, Json},
    routing::{delete, get, post, put},
};
use base64::Engine;
use sqlx::SqlitePool;
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_governor::governor::GovernorConfigBuilder;
use tower_http::{
    cors::CorsLayer,
    services::{ServeDir, ServeFile},
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use models::{
    ChangePasswordRequest, ChangePasswordResponse, Claims, CreateMemberRequest, LoginRequest,
    LoginResponse, RegistrationRequest, UpdateMemberRequest, UpdateProfileRequest,
    UpdateProfileResponse, UserInfo,
};

#[derive(Clone)]
pub struct AppState {
    db: SqlitePool,
    jwt_secret: String,
    registration_secret: String,
}

#[tokio::main]
async fn main() {
    // Initialize structured logging with tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "socialpreview_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load environment variables from .env file
    dotenvy::dotenv().ok();

    // Configuration
    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set in .env file");
    let registration_secret =
        std::env::var("REGISTRATION_SECRET").expect("REGISTRATION_SECRET must be set in .env file");
    let frontend_url =
        std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:5173".to_string());
    let database_url =
        std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:socialpreview.db".to_string());

    // Database Initialization
    let db = database::init_db(&database_url)
        .await
        .expect("Failed to initialize database connection pool");

    let state = AppState {
        db,
        jwt_secret,
        registration_secret,
    };

    // CORS Configuration - Restrict access to the frontend URL
    let cors = CorsLayer::new()
        .allow_origin(
            frontend_url
                .parse::<axum::http::HeaderValue>()
                .expect("Invalid FRONTEND_URL"),
        )
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION, header::ACCEPT])
        .allow_credentials(true);

    // Rate Limiting - Global API protection
    let _governor_config = Arc::new(
        GovernorConfigBuilder::default()
            .per_millisecond(60000) // Reset every minute
            .burst_size(100) // Allow 100 requests per minute
            .finish()
            .expect("Failed to create governor config - invalid rate limit settings"),
    );

    // Stricter Rate Limiting for Auth endpoints to prevent brute-force
    let _auth_governor_config = Arc::new(
        GovernorConfigBuilder::default()
            .per_millisecond(60000)
            .burst_size(5) // Allow only 5 auth attempts per minute
            .finish()
            .expect("Failed to create auth governor config - invalid rate limit settings"),
    );

    // Public Routes - Accessible without authentication
    let public_routes = Router::new()
        .route("/health", get(health_check))
        .route("/auth/login", post(login))
        .route("/auth/logout", post(logout))
        .route("/auth/register", post(register));

    // Protected Routes - Require valid JWT token
    let protected_routes = Router::new()
        .route("/auth/me", get(get_current_user))
        .route("/auth/change-password", post(change_password))
        .route("/auth/profile", put(update_profile))
        .route("/auth/profile/upload", post(update_profile_multipart))
        // 2FA
        .route("/auth/2fa/setup", post(handlers_2fa::setup_2fa))
        .route(
            "/auth/2fa/verify",
            post(handlers_2fa::verify_and_enable_2fa),
        )
        .route("/auth/2fa/disable", post(handlers_2fa::disable_2fa))
        // Tickets
        .route("/tickets", post(handlers_tickets::create_ticket))
        .route("/tickets/my", get(handlers_tickets::get_my_tickets))
        .route("/tickets/all", get(handlers_tickets::get_all_tickets))
        .route("/tickets/:id", get(handlers_tickets::get_ticket_by_id))
        .route("/tickets/:id", put(handlers_tickets::update_ticket))
        .route(
            "/tickets/:id/comments",
            post(handlers_tickets::add_ticket_comment),
        )
        .route(
            "/tickets/:id/comments",
            get(handlers_tickets::get_ticket_comments),
        )
        // Tasks
        .route("/tasks", post(handlers_tasks::create_task))
        .route("/tasks", get(handlers_tasks::get_tasks))
        .route("/tasks/my", get(handlers_tasks::get_my_tasks))
        .route("/tasks/:id", put(handlers_tasks::update_task))
        .route(
            "/tasks/:id/comments",
            post(handlers_tasks::add_task_comment),
        )
        .route(
            "/tasks/:id/comments",
            get(handlers_tasks::get_task_comments),
        )
        // Features (Absences, News, Blog, Members, Stats, plans, schedule, calendar)
        .route("/absences", post(handlers_features::create_absence))
        .route("/absences", get(handlers_features::get_absences))
        .route("/absences/:id", put(handlers_features::update_absence))
        .route("/news", post(handlers_features::create_news))
        .route("/news", get(handlers_features::get_news))
        .route("/news/:id", put(handlers_features::update_news))
        .route("/news/:id", delete(handlers_features::delete_news))
        .route("/blog", post(handlers_features::create_blog_post))
        .route("/blog", get(handlers_features::get_blog_posts))
        .route("/blog/:id", put(handlers_features::update_blog_post))
        .route("/blog/:id", delete(handlers_features::delete_blog_post))
        .route("/members", get(handlers_features::get_team_members))
        .route("/members", post(create_member))
        .route("/members/:id", put(update_member))
        .route("/members/:id", delete(delete_member))
        .route("/statistics", get(handlers_features::get_statistics))
        .route("/plans", post(handlers_features::create_future_plan))
        .route("/plans", get(handlers_features::get_future_plans))
        .route("/plans/:id", put(handlers_features::update_future_plan))
        .route("/plans/:id", delete(handlers_features::delete_future_plan))
        .route("/schedules", post(handlers_features::create_schedule))
        .route("/schedules", get(handlers_features::get_schedules))
        .route("/calendar", post(handlers_features::create_calendar_event))
        .route("/calendar", get(handlers_features::get_calendar_events))
        // Services
        .route("/services", post(handlers_services::create_service))
        .route("/services/all", get(handlers_services::get_all_services))
        .route("/services/my", get(handlers_services::get_my_services))
        .route(
            "/services/statistics",
            get(handlers_services::get_service_statistics),
        )
        .route("/services/:id", put(handlers_services::update_service))
        .route("/services/:id", delete(handlers_services::delete_service))
        // Layout Middleware
        .layer(axum_middleware::from_fn_with_state(
            state.clone(),
            middleware::auth_middleware,
        ));

    // Combine all routes
    let api_routes = Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .with_state(state.clone());

    // Static File Serving (Frontend)
    let serve_dir = ServeDir::new("frontend/dist")
        .not_found_service(ServeFile::new("frontend/dist/index.html"));

    let app = Router::new()
        .nest("/api", api_routes)
        .route(
            "/",
            get(|| async { axum::response::Redirect::temporary("/index.html") }),
        )
        .fallback_service(serve_dir)
        .layer(
            ServiceBuilder::new()
                .layer(cors)
                .layer(DefaultBodyLimit::max(50 * 1024 * 1024)), // 50MB limit for large image uploads
        );

    // Initial Server Startup Log
    let addr = format!("{}:{}", host, port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind to address");

    tracing::info!("Server running on http://{}", addr);
    tracing::info!("Database connected: {}", database_url);

    axum::serve(listener, app)
        .await
        .expect("Failed to start server");
}

async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "service": "SocialPreview Backend",
        "version": env!("CARGO_PKG_VERSION")
    }))
}

async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegistrationRequest>,
) -> impl IntoResponse {
    use validator::Validate;

    if payload.registration_secret != state.registration_secret {
        return (
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({
                "success": false,
                "error": "Invalid registration secret"
            })),
        );
    }

    if let Err(e) = payload.validate() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "success": false,
                "error": format!("Validation failed: {}", e)
            })),
        );
    }

    match database::find_user_by_email(&state.db, &payload.email).await {
        Ok(Some(_)) => {
            return (
                StatusCode::CONFLICT,
                Json(serde_json::json!({
                    "success": false,
                    "error": "User with this email already exists"
                })),
            );
        }
        Ok(None) => {}
        Err(e) => {
            tracing::error!("Database error: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "success": false,
                    "error": "Database error"
                })),
            );
        }
    }

    let password_hash = match auth::hash_password(&payload.password) {
        Ok(hash) => hash,
        Err(e) => {
            tracing::error!("Failed to hash password: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "success": false,
                    "error": "Failed to hash password"
                })),
            );
        }
    };

    match database::create_user(
        &state.db,
        &payload.name,
        &payload.nickname,
        &payload.email,
        &password_hash,
        payload.role,
    )
    .await
    {
        Ok(user) => {
            tracing::info!("User registered successfully: {}", user.email);
            (
                StatusCode::CREATED,
                Json(serde_json::json!({
                    "success": true,
                    "user": {
                        "id": user.id.to_string(),
                        "email": user.email,
                        "name": user.name,
                        "nickname": user.nickname,
                        "role": user.role,
                    }
                })),
            )
        }
        Err(e) => {
            tracing::error!("Failed to create user: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "success": false,
                    "error": "Failed to create user"
                })),
            )
        }
    }
}

async fn get_current_user(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    tracing::info!("Fetching user info for: {}", claims.email);

    match database::find_user_by_id(&state.db, &claims.sub).await {
        Ok(Some(user)) => {
            let user_info = UserInfo::from(&user);
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "success": true,
                    "user": user_info,
                    "error": null
                })),
            )
        }
        Ok(None) => {
            tracing::warn!("User not found: {}", claims.sub);
            (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({
                    "success": false,
                    "user": null,
                    "error": "User not found"
                })),
            )
        }
        Err(e) => {
            tracing::error!("Database error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "success": false,
                    "user": null,
                    "error": "Failed to fetch user"
                })),
            )
        }
    }
}

use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};

async fn logout(jar: CookieJar) -> (CookieJar, impl IntoResponse) {
    let cookie = Cookie::build(("__Secure-SP-Session", ""))
        .path("/")
        .secure(true)
        .http_only(true)
        .same_site(SameSite::Lax)
        .build();

    (
        jar.remove(cookie),
        Json(serde_json::json!({
            "success": true,
            "message": "Logged out successfully"
        })),
    )
}

async fn login(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(payload): Json<LoginRequest>,
) -> (CookieJar, impl IntoResponse) {
    tracing::info!("Login attempt for email: {}", payload.email);

    if !payload.email.contains('@') {
        return (
            jar,
            (
                StatusCode::BAD_REQUEST,
                Json(LoginResponse {
                    success: false,
                    user: None,
                    token: None,
                    error: Some("Invalid email format".to_string()),
                    requires_2fa: None,
                    temp_token: None,
                }),
            )
                .into_response(),
        );
    }

    let user = match database::find_user_by_email(&state.db, &payload.email).await {
        Ok(Some(u)) => u,
        Ok(None) => {
            tracing::warn!("Login failed: User not found");
            return (
                jar,
                (
                    StatusCode::UNAUTHORIZED,
                    Json(LoginResponse {
                        success: false,
                        user: None,
                        token: None,
                        error: Some("Invalid email or password".to_string()),
                        requires_2fa: None,
                        temp_token: None,
                    }),
                )
                    .into_response(),
            );
        }
        Err(e) => {
            tracing::error!("Database error: {}", e);
            return (
                jar,
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(LoginResponse {
                        success: false,
                        user: None,
                        token: None,
                        error: Some("Authentication error".to_string()),
                        requires_2fa: None,
                        temp_token: None,
                    }),
                )
                    .into_response(),
            );
        }
    };

    match auth::verify_password(&payload.password, &user.password_hash) {
        Ok(true) => {
            tracing::info!(
                "Password verified for user: {} (role: {:?})",
                user.email,
                user.role
            );

            if user.totp_enabled {
                match &payload.totp_code {
                    Some(code) => {
                        let secret = match &user.totp_secret {
                            Some(s) => s,
                            None => {
                                return (
                                    jar,
                                    (
                                        StatusCode::INTERNAL_SERVER_ERROR,
                                        Json(LoginResponse {
                                            success: false,
                                            user: None,
                                            token: None,
                                            error: Some("2FA configuration error".to_string()),
                                            requires_2fa: None,
                                            temp_token: None,
                                        }),
                                    )
                                        .into_response(),
                                );
                            }
                        };

                        match totp::verify_totp_with_window(secret, code, &user.email) {
                            Ok(true) => {}
                            Ok(false) => {
                                return (
                                    jar,
                                    (
                                        StatusCode::UNAUTHORIZED,
                                        Json(LoginResponse {
                                            success: false,
                                            user: None,
                                            token: None,
                                            error: Some("Invalid 2FA code".to_string()),
                                            requires_2fa: Some(true),
                                            temp_token: None,
                                        }),
                                    )
                                        .into_response(),
                                );
                            }
                            Err(_) => {
                                return (
                                    jar,
                                    (
                                        StatusCode::INTERNAL_SERVER_ERROR,
                                        Json(LoginResponse {
                                            success: false,
                                            user: None,
                                            token: None,
                                            error: Some("2FA verification error".to_string()),
                                            requires_2fa: None,
                                            temp_token: None,
                                        }),
                                    )
                                        .into_response(),
                                );
                            }
                        }
                    }
                    None => {
                        return (
                            jar,
                            (
                                StatusCode::OK,
                                Json(LoginResponse {
                                    success: false,
                                    user: None,
                                    token: None,
                                    error: None,
                                    requires_2fa: Some(true),
                                    temp_token: None,
                                }),
                            )
                                .into_response(),
                        );
                    }
                }
            }

            let exp = match chrono::Utc::now().checked_add_signed(chrono::Duration::days(7)) {
                Some(time) => time.timestamp() as usize,
                None => {
                    return (
                        jar,
                        (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(LoginResponse {
                                success: false,
                                user: None,
                                token: None,
                                error: Some("Token error".to_string()),
                                requires_2fa: None,
                                temp_token: None,
                            }),
                        )
                            .into_response(),
                    );
                }
            };

            let claims = Claims {
                sub: user.id.to_string(),
                email: user.email.clone(),
                role: user.role.clone(),
                exp,
            };

            let token = match auth::generate_token(&claims, &state.jwt_secret) {
                Ok(t) => t,
                Err(_) => {
                    return (
                        jar,
                        (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(LoginResponse {
                                success: false,
                                user: None,
                                token: None,
                                error: Some("Token generation error".to_string()),
                                requires_2fa: None,
                                temp_token: None,
                            }),
                        )
                            .into_response(),
                    );
                }
            };

            let cookie = Cookie::build(("__Secure-SP-Session", token))
                .path("/")
                .secure(true)
                .http_only(true)
                .same_site(SameSite::Lax)
                .build();

            (
                jar.add(cookie),
                (
                    StatusCode::OK,
                    Json(LoginResponse {
                        success: true,
                        user: Some(UserInfo::from(&user)),
                        token: None, // Token is now in cookie only
                        error: None,
                        requires_2fa: None,
                        temp_token: None,
                    }),
                )
                    .into_response(),
            )
        }
        Ok(false) => (
            jar,
            (
                StatusCode::UNAUTHORIZED,
                Json(LoginResponse {
                    success: false,
                    user: None,
                    token: None,
                    error: Some("Invalid email or password".to_string()),
                    requires_2fa: None,
                    temp_token: None,
                }),
            )
                .into_response(),
        ),
        Err(e) => {
            tracing::error!("Password verification error: {}", e);
            (
                jar,
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(LoginResponse {
                        success: false,
                        user: None,
                        token: None,
                        error: Some("Authentication error".to_string()),
                        requires_2fa: None,
                        temp_token: None,
                    }),
                )
                    .into_response(),
            )
        }
    }
}

async fn change_password(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<ChangePasswordRequest>,
) -> impl IntoResponse {
    tracing::info!("Password change request for user: {}", claims.email);

    if let Err(e) = auth::validate_password_complexity(&payload.new_password) {
        return (
            StatusCode::BAD_REQUEST,
            Json(ChangePasswordResponse {
                success: false,
                message: None,
                error: Some(e),
            }),
        );
    }

    let user = match database::find_user_by_email(&state.db, &claims.email).await {
        Ok(Some(u)) => u,
        Ok(None) => {
            tracing::error!("User not found: {}", claims.email);
            return (
                StatusCode::NOT_FOUND,
                Json(ChangePasswordResponse {
                    success: false,
                    message: None,
                    error: Some("User not found".to_string()),
                }),
            );
        }
        Err(e) => {
            tracing::error!("Database error: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ChangePasswordResponse {
                    success: false,
                    message: None,
                    error: Some("Database error".to_string()),
                }),
            );
        }
    };

    match auth::verify_password(&payload.current_password, &user.password_hash) {
        Ok(true) => {
            let new_hash = match auth::hash_password(&payload.new_password) {
                Ok(h) => h,
                Err(e) => {
                    tracing::error!("Failed to hash new password: {}", e);
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(ChangePasswordResponse {
                            success: false,
                            message: None,
                            error: Some("Failed to process password".to_string()),
                        }),
                    );
                }
            };

            match database::update_password(&state.db, &claims.email, &new_hash).await {
                Ok(_) => {
                    tracing::info!("Password changed successfully for user: {}", claims.email);
                    (
                        StatusCode::OK,
                        Json(ChangePasswordResponse {
                            success: true,
                            message: Some("Password changed successfully".to_string()),
                            error: None,
                        }),
                    )
                }
                Err(e) => {
                    tracing::error!("Failed to update password: {}", e);
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(ChangePasswordResponse {
                            success: false,
                            message: None,
                            error: Some("Failed to update password".to_string()),
                        }),
                    )
                }
            }
        }
        Ok(false) => {
            tracing::warn!("Password change failed: Invalid current password");
            (
                StatusCode::UNAUTHORIZED,
                Json(ChangePasswordResponse {
                    success: false,
                    message: None,
                    error: Some("Current password is incorrect".to_string()),
                }),
            )
        }
        Err(e) => {
            tracing::error!("Password verification error: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ChangePasswordResponse {
                    success: false,
                    message: None,
                    error: Some("Authentication error".to_string()),
                }),
            )
        }
    }
}

async fn update_profile(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<UpdateProfileRequest>,
) -> impl IntoResponse {
    tracing::info!("Profile update request for user: {}", claims.email);

    if let Some(ref nickname) = payload.nickname
        && nickname.len() < 3
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(UpdateProfileResponse {
                success: false,
                user: None,
                error: Some("Nickname must be at least 3 characters".to_string()),
            }),
        );
    }

    match database::update_profile(
        &state.db,
        &claims.sub,
        payload.name.as_deref(),
        payload.nickname.as_deref(),
        payload.profile_picture.as_deref(),
    )
    .await
    {
        Ok(_) => match database::find_user_by_id(&state.db, &claims.sub).await {
            Ok(Some(user)) => {
                tracing::info!("Profile updated successfully for user: {}", claims.email);
                (
                    StatusCode::OK,
                    Json(UpdateProfileResponse {
                        success: true,
                        user: Some(UserInfo::from(&user)),
                        error: None,
                    }),
                )
            }
            Ok(None) => (
                StatusCode::NOT_FOUND,
                Json(UpdateProfileResponse {
                    success: false,
                    user: None,
                    error: Some("User not found".to_string()),
                }),
            ),
            Err(e) => {
                tracing::error!("Failed to fetch updated user: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(UpdateProfileResponse {
                        success: false,
                        user: None,
                        error: Some("Failed to fetch updated profile".to_string()),
                    }),
                )
            }
        },
        Err(e) => {
            tracing::error!("Failed to update profile: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(UpdateProfileResponse {
                    success: false,
                    user: None,
                    error: Some("Failed to update profile".to_string()),
                }),
            )
        }
    }
}

async fn update_profile_multipart(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    tracing::info!(
        "Multipart profile update request for user: {}",
        claims.email
    );

    const MAX_FILE_SIZE: usize = 20 * 1024 * 1024; // 20MB

    let mut name: Option<String> = None;
    let mut nickname: Option<String> = None;
    let mut profile_picture_base64: Option<String> = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        let field_name = field.name().unwrap_or("").to_string();

        match field_name.as_str() {
            "name" => {
                if let Ok(value) = field.text().await {
                    name = if value.is_empty() { None } else { Some(value) };
                }
            }
            "nickname" => {
                if let Ok(value) = field.text().await {
                    nickname = if value.is_empty() { None } else { Some(value) };
                }
            }
            "profile_picture" => {
                let content_type = field.content_type().unwrap_or("").to_string();

                if !content_type.starts_with("image/") {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(UpdateProfileResponse {
                            success: false,
                            user: None,
                            error: Some("Only image files are allowed".to_string()),
                        }),
                    );
                }

                match field.bytes().await {
                    Ok(bytes) => {
                        if bytes.len() > MAX_FILE_SIZE {
                            return (
                                StatusCode::PAYLOAD_TOO_LARGE,
                                Json(UpdateProfileResponse {
                                    success: false,
                                    user: None,
                                    error: Some("File size exceeds 20MB limit".to_string()),
                                }),
                            );
                        }

                        // Convert to base64 data URL for storage
                        let base64_data = base64::engine::general_purpose::STANDARD.encode(&bytes);
                        profile_picture_base64 =
                            Some(format!("data:{};base64,{}", content_type, base64_data));

                        tracing::info!(
                            "Received profile picture: {} bytes, type: {}",
                            bytes.len(),
                            content_type
                        );
                    }
                    Err(e) => {
                        tracing::error!("Failed to read file bytes: {}", e);
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(UpdateProfileResponse {
                                success: false,
                                user: None,
                                error: Some("Failed to read uploaded file".to_string()),
                            }),
                        );
                    }
                }
            }
            _ => {}
        }
    }

    // Validate nickname if provided
    if let Some(ref nick) = nickname
        && nick.len() < 3
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(UpdateProfileResponse {
                success: false,
                user: None,
                error: Some("Nickname must be at least 3 characters".to_string()),
            }),
        );
    }

    match database::update_profile(
        &state.db,
        &claims.sub,
        name.as_deref(),
        nickname.as_deref(),
        profile_picture_base64.as_deref(),
    )
    .await
    {
        Ok(_) => match database::find_user_by_id(&state.db, &claims.sub).await {
            Ok(Some(user)) => {
                tracing::info!("Profile updated successfully for user: {}", claims.email);
                (
                    StatusCode::OK,
                    Json(UpdateProfileResponse {
                        success: true,
                        user: Some(UserInfo::from(&user)),
                        error: None,
                    }),
                )
            }
            Ok(None) => (
                StatusCode::NOT_FOUND,
                Json(UpdateProfileResponse {
                    success: false,
                    user: None,
                    error: Some("User not found".to_string()),
                }),
            ),
            Err(e) => {
                tracing::error!("Failed to fetch updated user: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(UpdateProfileResponse {
                        success: false,
                        user: None,
                        error: Some("Failed to fetch updated profile".to_string()),
                    }),
                )
            }
        },
        Err(e) => {
            tracing::error!("Failed to update profile: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(UpdateProfileResponse {
                    success: false,
                    user: None,
                    error: Some("Failed to update profile".to_string()),
                }),
            )
        }
    }
}

async fn create_member(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateMemberRequest>,
) -> impl IntoResponse {
    if claims.role != crate::models::UserRole::Management {
        return (
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({
                "success": false,
                "error": "Access denied: Management role required"
            })),
        );
    }

    tracing::info!("Create member request by: {}", claims.email);

    if payload.name.is_empty() || payload.nickname.len() < 3 || !payload.email.contains('@') {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "success": false,
                "error": "Invalid input: name, nickname (min 3 chars), and valid email required"
            })),
        );
    }

    if let Err(e) = auth::validate_password_complexity(&payload.password) {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "success": false,
                "error": e
            })),
        );
    }

    let password_hash = match auth::hash_password(&payload.password) {
        Ok(h) => h,
        Err(e) => {
            tracing::error!("Failed to hash password: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "success": false,
                    "error": "Failed to process password"
                })),
            );
        }
    };

    match database::create_user(
        &state.db,
        &payload.name,
        &payload.nickname,
        &payload.email,
        &password_hash,
        payload.role,
    )
    .await
    {
        Ok(user) => {
            tracing::info!("Member created: {} by {}", user.email, claims.email);
            (
                StatusCode::CREATED,
                Json(serde_json::json!({
                    "success": true,
                    "user": UserInfo::from(&user)
                })),
            )
        }
        Err(e) => {
            tracing::error!("Failed to create member: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "success": false,
                    "error": "Failed to create member (email or nickname may already exist)"
                })),
            )
        }
    }
}

async fn update_member(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(member_id): Path<String>,
    Json(payload): Json<UpdateMemberRequest>,
) -> impl IntoResponse {
    if claims.role != crate::models::UserRole::Management {
        return (
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({
                "success": false,
                "error": "Access denied: Management role required"
            })),
        );
    }

    tracing::info!("Update member {} request by: {}", member_id, claims.email);

    // Hash password if provided
    let password_hash = if let Some(ref password) = payload.password {
        if let Err(e) = auth::validate_password_complexity(password) {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({
                    "success": false,
                    "error": e
                })),
            );
        }

        match auth::hash_password(password) {
            Ok(h) => Some(h),
            Err(e) => {
                tracing::error!("Failed to hash password: {}", e);
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({
                        "success": false,
                        "error": "Failed to process password"
                    })),
                );
            }
        }
    } else {
        None
    };

    match database::update_member(
        &state.db,
        &member_id,
        payload.name.as_deref(),
        payload.nickname.as_deref(),
        payload.email.as_deref(),
        payload.role,
        password_hash.as_deref(),
    )
    .await
    {
        Ok(_) => {
            tracing::info!("Member {} updated by {}", member_id, claims.email);
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "success": true,
                    "message": "Member updated successfully"
                })),
            )
        }
        Err(e) => {
            tracing::error!("Failed to update member: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "success": false,
                    "error": "Failed to update member"
                })),
            )
        }
    }
}

async fn delete_member(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(member_id): Path<String>,
) -> impl IntoResponse {
    if claims.role != crate::models::UserRole::Management {
        return (
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({
                "success": false,
                "error": "Access denied: Management role required"
            })),
        );
    }

    if claims.sub == member_id {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "success": false,
                "error": "Cannot delete your own account"
            })),
        );
    }

    tracing::info!("Delete member {} request by: {}", member_id, claims.email);

    match database::delete_user(&state.db, &member_id).await {
        Ok(_) => {
            tracing::info!("Member {} deleted by {}", member_id, claims.email);
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "success": true,
                    "message": "Member deleted successfully"
                })),
            )
        }
        Err(e) => {
            tracing::error!("Failed to delete member: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "success": false,
                    "error": "Failed to delete member"
                })),
            )
        }
    }
}
