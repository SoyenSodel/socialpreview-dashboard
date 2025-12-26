use axum::{
    Json,
    extract::{Request, State},
    http::{StatusCode, header},
    middleware::Next,
    response::{IntoResponse, Response},
};
use serde_json::json;

use crate::{AppState, auth};

pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, Response> {
    let cookie_header = request
        .headers()
        .get(header::COOKIE)
        .and_then(|h| h.to_str().ok());

    let token = cookie_header.and_then(|c| {
        c.split(';')
            .find(|s| s.trim().starts_with("__Secure-SP-Session="))
            .map(|s| {
                let part = s.trim();
                &part["__Secure-SP-Session=".len()..]
            })
    });

    let token = match token {
        Some(t) => t,
        None => {
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "error": "Missing authentication cookie"
                })),
            )
                .into_response());
        }
    };

    let claims = match auth::validate_token(token, &state.jwt_secret) {
        Ok(c) => c,
        Err(e) => {
            tracing::warn!("Token validation failed: {}", e);
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "error": "Invalid or expired session"
                })),
            )
                .into_response());
        }
    };

    request.extensions_mut().insert(claims);

    Ok(next.run(request).await)
}
