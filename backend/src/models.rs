use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    Management,
    Team,
    User,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub nickname: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: UserRole,
    pub profile_picture: Option<String>,
    #[serde(skip_serializing)]
    pub totp_secret: Option<String>,
    pub totp_enabled: bool,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
    pub totp_code: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct RegistrationRequest {
    pub registration_secret: String,
    #[validate(length(min = 1))]
    pub name: String,
    #[validate(length(min = 1))]
    pub nickname: String,
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 12))]
    pub password: String,
    pub role: UserRole,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub success: bool,
    pub user: Option<UserInfo>,
    pub token: Option<String>,
    pub error: Option<String>,
    pub requires_2fa: Option<bool>,
    pub temp_token: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct UserInfo {
    pub id: String,
    pub name: String,
    pub nickname: String,
    pub email: String,
    pub role: UserRole,
    pub profile_picture: Option<String>,
    pub totp_enabled: bool,
}

impl From<&User> for UserInfo {
    fn from(user: &User) -> Self {
        Self {
            id: user.id.to_string(),
            name: user.name.clone(),
            nickname: user.nickname.clone(),
            email: user.email.clone(),
            role: user.role.clone(),
            profile_picture: user.profile_picture.clone(),
            totp_enabled: user.totp_enabled,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

#[derive(Debug, Serialize)]
pub struct ChangePasswordResponse {
    pub success: bool,
    pub message: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    pub name: Option<String>,
    pub nickname: Option<String>,
    pub profile_picture: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct UpdateProfileResponse {
    pub success: bool,
    pub user: Option<UserInfo>,
    pub error: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMemberRequest {
    pub name: String,
    pub nickname: String,
    pub email: String,
    pub password: String,
    pub role: UserRole,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMemberRequest {
    pub name: Option<String>,
    pub nickname: Option<String>,
    pub email: Option<String>,
    pub role: Option<UserRole>,
    pub password: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub role: UserRole,
    pub exp: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TicketPriority {
    Low,
    Medium,
    High,
    Urgent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TicketStatus {
    Open,
    InProgress,
    Resolved,
    Closed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ticket {
    pub id: String,
    pub user_id: String,
    pub title: String,
    pub description: String,
    pub priority: TicketPriority,
    pub status: TicketStatus,
    pub assigned_to: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub resolved_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTicketRequest {
    pub title: String,
    pub description: String,
    pub priority: TicketPriority,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTicketRequest {
    pub status: Option<TicketStatus>,
    pub assigned_to: Option<String>,
    pub priority: Option<TicketPriority>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketComment {
    pub id: String,
    pub ticket_id: String,
    pub user_id: String,
    pub user_name: String,
    pub comment: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCommentRequest {
    pub comment: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskPriority {
    Low,
    Medium,
    High,
    Urgent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Pending,
    InProgress,
    Completed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assigned_to: Option<String>,
    pub assigned_users: Vec<AssignedUser>,
    pub created_by: String,
    pub created_by_name: String,
    pub priority: TaskPriority,
    pub status: TaskStatus,
    pub due_date: Option<String>,
    pub completed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignedUser {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskRequest {
    pub title: String,
    pub description: Option<String>,
    pub assigned_to: Vec<String>,
    pub priority: TaskPriority,
    pub due_date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskRequest {
    pub status: Option<TaskStatus>,
    pub priority: Option<TaskPriority>,
    pub due_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskComment {
    pub id: String,
    pub task_id: String,
    pub user_id: String,
    pub user_name: String,
    pub comment: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AbsenceStatus {
    Pending,
    Approved,
    Rejected,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Absence {
    pub id: String,
    pub user_id: String,
    pub user_name: String,
    pub reason: String,
    pub description: Option<String>,
    pub start_date: String,
    pub end_date: String,
    pub status: AbsenceStatus,
    pub approved_by: Option<String>,
    pub approved_by_name: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateAbsenceRequest {
    pub reason: String,
    pub description: Option<String>,
    pub start_date: String,
    pub end_date: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAbsenceRequest {
    pub status: AbsenceStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct News {
    pub id: String,
    pub title: String,
    pub content: String,
    pub author_id: String,
    pub author_name: String,
    pub is_pinned: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateNewsRequest {
    pub title: String,
    pub content: String,
    pub is_pinned: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNewsRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub is_pinned: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BlogStatus {
    Draft,
    Published,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlogPost {
    pub id: String,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub excerpt: Option<String>,
    pub author_id: String,
    pub author_name: String,
    pub status: BlogStatus,
    pub published_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateBlogPostRequest {
    pub title: String,
    pub content: String,
    pub excerpt: Option<String>,
    pub status: Option<BlogStatus>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBlogPostRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub excerpt: Option<String>,
    pub status: Option<BlogStatus>,
}

#[derive(Debug, Serialize)]
pub struct Setup2FAResponse {
    pub success: bool,
    pub secret: Option<String>,
    pub qr_code: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Verify2FARequest {
    pub code: String,
}

#[derive(Debug, Serialize)]
pub struct Verify2FAResponse {
    pub success: bool,
    pub message: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Disable2FARequest {
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct Disable2FAResponse {
    pub success: bool,
    pub message: Option<String>,
    pub error: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Serialize)]
pub struct TeamStatistics {
    pub total_tasks: i64,
    pub completed_tasks: i64,
    pub pending_tasks: i64,
    pub in_progress_tasks: i64,
    pub total_members: i64,
    pub active_absences: i64,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ServiceType {
    WebDevelopment,
    SocialMedia,
    Seo,
    GraphicDesign,
    Other,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ServiceStatus {
    Active,
    Completed,
    Paused,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Service {
    pub id: String,
    pub user_id: String,
    pub user_name: Option<String>,
    pub name: String,
    pub description: String,
    pub service_type: String,
    pub price: f64,
    pub status: String,
    pub start_date: String,
    pub end_date: Option<String>,
    pub progress: i32,
    pub notes: Option<String>,
    pub created_by: String,
    pub created_by_name: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateServiceRequest {
    #[validate(length(min = 1, message = "User ID is required"))]
    pub user_id: String,
    #[validate(length(min = 1, message = "Name is required"))]
    pub name: String,
    #[validate(length(min = 1, message = "Description is required"))]
    pub description: String,
    #[validate(length(min = 1, message = "Service type is required"))]
    pub service_type: String,
    pub price: f64,
    pub status: Option<String>,
    #[validate(length(min = 1, message = "Start date is required"))]
    pub start_date: String,
    pub end_date: Option<String>,
    pub progress: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateServiceRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub service_type: Option<String>,
    pub price: Option<f64>,
    pub status: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub progress: Option<i32>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ServiceStatistics {
    pub total_services: i64,
    pub active_services: i64,
    pub completed_services: i64,
    pub paused_services: i64,
    pub total_value: f64,
    pub active_value: f64,
}
