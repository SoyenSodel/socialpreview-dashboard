# Architecture & Concepts

This document provides a technical deep-dive into the SocialPreview Dashboard.

## 🔐 Authorization & Roles

The application uses a strict Role-Based Access Control (RBAC) system. The `UserRole` enum is fundamental to the security model.

### 1. Management (Admin)

* **Access Level:** Highest.
* **Internal Role Name:** `management`
* **Capabilities:**
  * Full access to all system features.
  * Can manage sensitive system configurations.
  * Can create, update, and delete other team members.
  * Can create/delete/update all tickets, tasks, and services.
  * *Intended for:* Business owners, System Administrators.

### 2. Team (Staff)

* **Access Level:** Privileged.
* **Internal Role Name:** `team`
* **Capabilities:**
  * Can view and manage all Tickets, Tasks, and Services.
  * Can publish Blog Posts and News.
  * Can view Statistics and Team Members.
  * **Restriction:** Some sensitive "destructive" actions might be restricted to Management (e.g., deleting a critical member).
  * *Intended for:* Support agents, Developers, Managers.

### 3. User (Client)

* **Access Level:** Restricted (Self-Service).
* **Internal Role Name:** `user`
* **Capabilities:**
  * Can only access *their own* data (scoped by `user_id`).
  * Can create Tickets (Support requests).
  * Can view Services assigned to them (Client Portal).
  * No access to internal team features (Tasks, Statistics, internal News).
  * *Intended for:* Customers, Clients.

## 🏗️ Technical Stack Deep Dive

### Backend (Rust/Axum)

* **Entry Point:** `src/main.rs` initializes the app, DB, and routes.
* **State Management:** `AppState` struct holds the DB pool and secrets, shared across threads safely via `Arc`.
* **Middleware:** `auth_middleware` prevents unauthorized access by verifying JWT tokens before the request hits the handler.

### Authentication Flow

1. **Login:** `POST /api/auth/login` checks email/password (Argon2).
2. **2FA:** If `totp_enabled`, validates the TOTP code.
3. **JWT:** Returns a signed JWT token containing `sub` (user ID), `role`, and `email`.
4. **Requests:** Client sends `Authorization: Bearer <token>`.
5. **Validation:** Middleware decodes the token. If valid, injects `Claims` into the request extensions for the handler to use.
    * *Expired tokens return 401 Unauthorized.*

### Database Strategy

* **Users Table:** The central identity store using UUIDs.
* **Relations:**
  * `tickets.user_id` -> `users.id` (Author)
  * `tickets.assigned_to` -> `users.id` (Staff)
  * `services.user_id` -> `users.id` (Client who owns the service)
  * `services.created_by` -> `users.id` (Staff who made it)

## 📁 Directory Structure Explained

```text
backend/src/
├── auth.rs           # Security logic (Hashing, JWT, Password rules)
├── database.rs       # Raw SQLx queries and DB init
├── handlers_*.rs     # Request handlers grouped by domain (Ticket, Task, etc.)
├── main.rs           # Router setup, CORS, App State
├── middleware.rs     # Auth checks interceptor
├── models.rs         # Structs (Rust types) mirroring DB tables & JSON
└── totp.rs           # Two-Factor (Google Authenticator) logic
```
