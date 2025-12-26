use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Json},
    Extension,
};
use crate::auth::{verify_password};
use crate::models::{
    Claims, Disable2FARequest, Disable2FAResponse, Setup2FAResponse, Verify2FARequest,
    Verify2FAResponse,
};
use crate::totp::{generate_qr_code, generate_secret, verify_totp_with_window};
use crate::AppState;

pub async fn setup_2fa(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> impl IntoResponse {
    let secret = generate_secret();

    let qr_code = match generate_qr_code(&secret, &claims.email) {
        Ok(qr) => qr,
        Err(e) => {
            tracing::error!("Failed to generate QR code: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(Setup2FAResponse {
                    success: false,
                    secret: None,
                    qr_code: None,
                    error: Some("Failed to generate QR code".to_string()),
                }),
            );
        }
    };

    let user_id = &claims.sub;
    let update_result = sqlx::query(
        "UPDATE users SET totp_secret = ? WHERE id = ?"
    )
    .bind(&secret)
    .bind(user_id)
    .execute(&state.db)
    .await;

    if let Err(e) = update_result {
        tracing::error!("Failed to store TOTP secret: {}", e);
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(Setup2FAResponse {
                success: false,
                secret: None,
                qr_code: None,
                error: Some("Failed to setup 2FA".to_string()),
            }),
        );
    }

    (
        StatusCode::OK,
        Json(Setup2FAResponse {
            success: true,
            secret: Some(secret),
            qr_code: Some(qr_code),
            error: None,
        }),
    )
}

pub async fn verify_and_enable_2fa(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<Verify2FARequest>,
) -> impl IntoResponse {
    let user_result = sqlx::query_as::<_, (Option<String>,)>(
        "SELECT totp_secret FROM users WHERE id = ?"
    )
    .bind(&claims.sub)
    .fetch_one(&state.db)
    .await;

    let (totp_secret,) = match user_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to fetch user TOTP secret: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(Verify2FAResponse {
                    success: false,
                    message: None,
                    error: Some("Failed to verify 2FA code".to_string()),
                }),
            );
        }
    };

    let secret = match totp_secret {
        Some(s) => s,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(Verify2FAResponse {
                    success: false,
                    message: None,
                    error: Some("2FA not setup. Please setup 2FA first.".to_string()),
                }),
            );
        }
    };

    match verify_totp_with_window(&secret, &payload.code, &claims.email) {
        Ok(true) => {
            let enable_result = sqlx::query(
                "UPDATE users SET totp_enabled = 1 WHERE id = ?"
            )
            .bind(&claims.sub)
            .execute(&state.db)
            .await;

            if let Err(e) = enable_result {
                tracing::error!("Failed to enable 2FA: {}", e);
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(Verify2FAResponse {
                        success: false,
                        message: None,
                        error: Some("Failed to enable 2FA".to_string()),
                    }),
                );
            }

            (
                StatusCode::OK,
                Json(Verify2FAResponse {
                    success: true,
                    message: Some("2FA enabled successfully".to_string()),
                    error: None,
                }),
            )
        }
        Ok(false) => {
            (
                StatusCode::BAD_REQUEST,
                Json(Verify2FAResponse {
                    success: false,
                    message: None,
                    error: Some("Invalid 2FA code".to_string()),
                }),
            )
        }
        Err(e) => {
            tracing::error!("Failed to verify TOTP code: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(Verify2FAResponse {
                    success: false,
                    message: None,
                    error: Some("Failed to verify 2FA code".to_string()),
                }),
            )
        }
    }
}

pub async fn disable_2fa(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<Disable2FARequest>,
) -> impl IntoResponse {
    let user_result = sqlx::query_as::<_, (String,)>(
        "SELECT password_hash FROM users WHERE id = ?"
    )
    .bind(&claims.sub)
    .fetch_one(&state.db)
    .await;

    let (password_hash,) = match user_result {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to fetch user password: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(Disable2FAResponse {
                    success: false,
                    message: None,
                    error: Some("Failed to disable 2FA".to_string()),
                }),
            );
        }
    };

    match verify_password(&payload.password, &password_hash) {
        Ok(true) => {
            let disable_result = sqlx::query(
                "UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?"
            )
            .bind(&claims.sub)
            .execute(&state.db)
            .await;

            if let Err(e) = disable_result {
                tracing::error!("Failed to disable 2FA: {}", e);
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(Disable2FAResponse {
                        success: false,
                        message: None,
                        error: Some("Failed to disable 2FA".to_string()),
                    }),
                );
            }

            (
                StatusCode::OK,
                Json(Disable2FAResponse {
                    success: true,
                    message: Some("2FA disabled successfully".to_string()),
                    error: None,
                }),
            )
        }
        Ok(false) => (
            StatusCode::UNAUTHORIZED,
            Json(Disable2FAResponse {
                success: false,
                message: None,
                error: Some("Invalid password".to_string()),
            }),
        ),
        Err(e) => {
            tracing::error!("Failed to verify password: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(Disable2FAResponse {
                    success: false,
                    message: None,
                    error: Some("Failed to verify password".to_string()),
                }),
            )
        }
    }
}
