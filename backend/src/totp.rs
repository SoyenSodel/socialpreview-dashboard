use base64::{Engine, engine::general_purpose::STANDARD};
use qrcode::QrCode;
use totp_rs::{Algorithm, Secret, TOTP};

/// Generates a random base32 encoded secret for TOTP.
pub fn generate_secret() -> String {
    let secret = Secret::generate_secret();
    secret.to_encoded().to_string()
}

/// Verifies a TOTP code against a secret.
///
/// Returns true if the code is valid for the current time window.
#[allow(dead_code)]
pub fn verify_totp(secret: &str, code: &str) -> Result<bool, String> {
    let secret_bytes = Secret::Encoded(secret.to_string())
        .to_bytes()
        .map_err(|e| format!("Invalid secret: {}", e))?;

    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret_bytes,
        Some("SocialPreview".to_string()),
        "user@socialpreview.cz".to_string(),
    )
    .map_err(|e| format!("Failed to create TOTP: {}", e))?;

    let result = totp
        .check_current(code)
        .map_err(|e| format!("Failed to verify code: {}", e))?;

    Ok(result)
}

/// Generates a standard OTP auth URI for QR codes.
pub fn generate_totp_uri(secret: &str, email: &str) -> Result<String, String> {
    let secret_obj = Secret::Encoded(secret.to_string());

    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret_obj
            .to_bytes()
            .map_err(|e| format!("Failed to decode secret: {}", e))?,
        Some("SocialPreview Dashboard".to_string()),
        email.to_string(),
    )
    .map_err(|e| format!("Failed to create TOTP: {}", e))?;

    Ok(totp.get_url())
}

/// Generates a Base64 encoded SVG QR code for TOTP setup.
///
/// This string can be embedded directly in an <img> tag.
pub fn generate_qr_code(secret: &str, email: &str) -> Result<String, String> {
    let uri = generate_totp_uri(secret, email)?;

    let code =
        QrCode::new(uri.as_bytes()).map_err(|e| format!("Failed to generate QR code: {}", e))?;

    let svg = code
        .render()
        .min_dimensions(200, 200)
        .dark_color(qrcode::render::svg::Color("#000000"))
        .light_color(qrcode::render::svg::Color("#ffffff"))
        .build();

    let encoded = STANDARD.encode(svg.as_bytes());
    Ok(format!("data:image/svg+xml;base64,{}", encoded))
}

pub fn verify_totp_with_window(secret: &str, code: &str, email: &str) -> Result<bool, String> {
    let secret_bytes = Secret::Encoded(secret.to_string())
        .to_bytes()
        .map_err(|e| format!("Invalid secret: {}", e))?;

    let totp = TOTP::new(
        Algorithm::SHA1,
        6,
        2,
        30,
        secret_bytes,
        Some("SocialPreview Dashboard".to_string()),
        email.to_string(),
    )
    .map_err(|e| format!("Failed to create TOTP: {}", e))?;

    match totp.check_current(code) {
        Ok(valid) => Ok(valid),
        Err(e) => {
            tracing::error!("TOTP verification error: {}", e);
            Ok(false)
        }
    }
}
