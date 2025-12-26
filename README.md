<div align="center">

# SocialPreview Dashboard

**Enterprise-Grade Team Management & Client Portal**

[![Rust](https://img.shields.io/badge/Backend-Axum-orange?style=flat-square&logo=rust)](https://github.com/tokio-rs/axum)
[![React](https://img.shields.io/badge/Frontend-React_18-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Database](https://img.shields.io/badge/DB-SQLite%2fPostgreSQL-lightgrey?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

*A comprehensive dashboard for managing teams, tickets, tasks, and client services.*

[Features](#features) • [Installation](#installation) • [Architecture](#architecture) • [Production Guide](#production-guide) • [**Backend Specs**](./ARCHITECTURE.md) • [**Frontend Specs**](./FRONTEND.md)

</div>

---

## Overview

SocialPreview Dashboard is a monolithic full-stack application designed to streamline internal operations and client interactions. It combines a high-performance Rust backend with a modern React frontend to deliver a seamless experience for task management, support ticketing, and service tracking.

### Key Features

* **👥 Team Management** — Role-based access control (Management, Team, User) with detailed member profiles.
* **🎫 Support Tickets** — Full-featured ticketing system with priorities, status tracking, and comments.
* **✅ Task Management** — Assign tasks, track deadlines, set priorities, and collaborate in real-time.
* **🔒 Secure Authentication** — JWT-based auth with 2FA (TOTP) support and secure password hashing (Argon2).
* **📅 Planning & Features** — Integrated calendar, absence tracking, future plans, and internal blog.
* **💰 Service Tracking** — Manage client services, track progress, pricing, and active status.
* **📊 Statistics** — Real-time insights into team productivity and service performance.

---

## <a id="architecture"></a>🏗️ Architecture

The project follows a standard client-server architecture:

### Backend (`/backend`)

* **Framework:** Rust (Axum)
* **Database:** SQLx (SQLite for dev / PostgreSQL recommended for prod)
* **Auth:** Secure HttpOnly Cookies (Google-Style) + JWT + Argon2 + TOTP
* **Logging:** Tracing (structured logging)

### Frontend (`/frontend`)

* **Framework:** React 18 + TypeScript + Vite
* **Styling:** Tailwind CSS
* **State:** Context API
* **HTTP:** Axios with interceptors

---

## <a id="installation"></a>🚀 Installation

### Prerequisites

* Rust (latest stable)
* Node.js (v18+)
* pnpm or npm

### 1. Backend Setup

```bash
cd backend

# Create .env file (already generated for you)
# Ensure DATABASE_URL and secrets are set

# Run migrations
sqlx database create
sqlx migrate run

# specific dir for uploads (optional, currently uses DB storage)
mkdir uploads

# Run server
cargo run
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

## <a id="registration"></a>🛠️ Manual Registration

Since the registration endpoint is protected by a secret key, you cannot simply "sign up" on the frontend initially. Use `curl` or Postman to create your first admin user.

**Endpoint:** `POST /api/auth/register`

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "registration_secret": "admin_secret_registration_key_2025",
    "name": "TheRemyyy",
    "nickname": "Remy",
    "email": "remy@socialpreview.net",
    "password": "StrongPassword123!",
    "role": "management"
  }'
```

> **Note:** The `registration_secret` is defined in your `backend/.env` file.

---

## <a id="production-guide"></a>⚠️ Production Guide

> [!IMPORTANT]
> **CRITICAL PRODUCTION WARNING**

This application performs excellently in development with SQLite. However, for a production environment like `panel.socialpreview.net`, strict adherence to the following guidelines is required:

### 1. Move to PostgreSQL

**Do not use SQLite in production.**

* **Why:** The current implementation stores profile pictures (up to 20MB) directly in the database as Base64 strings. SQLite will bloat rapidly and performance will degrade under concurrent writes.
* **Action:**
    1. Switch `DATABASE_URL` to a PostgreSQL connection string.
    2. Update `sqlx` dependencies to enable `postgres` features.
    3. Refactor `database.rs` queries to use Postgres syntax (`$1` instead of `?`).

### 2. File Storage Refactoring

**Database is not a file system.**

* **Pass 1 (Current):** Images are stored in the DB. This works for small teams (~10 users) but scales poorly.
* **Pass 2 (Recommended):** Refactor `update_profile_multipart` to save files to an S3 bucket or local disk (`./uploads`), storing only the *URL* in the database.

### 3. Security Headers

Ensure your reverse proxy (Nginx/Caddy) sets proper security headers:

* `Strict-Transport-Security`
* `X-Content-Type-Options`
* `Content-Security-Policy`

---

## 📁 Project Structure

```text
socialpreview-dashboard/
├── backend/
│   ├── migrations/         # SQL database migrations
│   ├── src/
│   │   ├── handlers_*.rs   # Domain-specific route handlers
│   │   ├── models.rs       # Data structures & Types
│   │   ├── auth.rs         # JWT & Password logic
│   │   ├── database.rs     # SQLx queries
│   │   └── main.rs         # App entry point & Router
│   └── .env                # Backend configuration
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # Global state (Auth, Theme)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── routes/         # Page components
│   │   └── config/         # App configuration
│   └── .env                # Frontend configuration
└── README.md               # Documentation
```

---

<div align="center">
<sub>Made with ❤️ by TheRemyyy</sub>
</div>
