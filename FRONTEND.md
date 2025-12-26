# Frontend Architecture

This document outlines the structure and design patterns used in the React frontend.

## ⚡ Tech Stack

* **Core:** React 18, TypeScript, Vite
* **Styling:** Tailwind CSS (Utility-first)
* **Routing:** React Router DOM v6
* **Icons:** Lucide React
* **State Management:** React Context API (Auth, Language)
* **HTTP Client:** Native `fetch` API wrapped in custom hooks/services

## 📂 Directory Structure

```text
frontend/src/
├── components/
│   ├── dashboard/        # Main dashboard layouts (Team & User)
│   │   ├── team/         # Admin widgets (News, Members, etc.)
│   │   └── user/         # User widgets (Tickets, Services)
│   ├── ui/               # Reusable atomic components (Button, Input)
│   ├── LoginScreen.tsx   # Authentication entry point
│   └── ProtectedRoute.tsx # Route guard wrapper
├── config/               # Environment configuration
├── contexts/
│   ├── AuthContext.tsx   # User session state & logic
│   └── LanguageContext.tsx # i18n logic
├── hooks/                # Custom hooks (e.g., useLocalStorage)
├── types/                # TypeScript interfaces (Shared with Backend)
├── utils/                # Helper functions (API calls, formatters)
└── App.tsx               # Root component & Routing definitions
```

## 🔐 Authentication & Security

The frontend uses `AuthContext` to manage the user's session.

1. **Token Storage:**
    * Tokens are stored in `localStorage` (or `sessionStorage` if "Remember Me" is unchecked).
    * **Security Note:** XSS checks are performed on inputs using `dompurify` before rendering to prevent malicious script injection.
2. **Route Protection:**
    * The `<ProtectedRoute>` component wraps sensitive routes.
    * It checks for `isAuthenticated`. If false, redirects to `/login`.
    * It loads the user profile via `/auth/me` on app init.

## 🚦 Routing Logic

The `App.tsx` handles the high-level routing:

* `/login`: Public access.
* `/dashboard`: Protected.
  * **Role Redirect:** Inside `/dashboard`, the `DashboardRouter` component checks `user.role`:
    * `management` | `team` -> Renders `<TeamDashboard />`
    * `user` -> Renders `<UserDashboard />`

## 🎨 Design System

We use Tailwind CSS for styling. Global styles are defined in `index.css`.
The layout is responsive:

* **Desktop:** Sidebar navigation.
* **Mobile:** Burger menu with overlay.

## 🌍 Internationalization (i18n)

handled by `LanguageContext`.

* Translations are stored in `src/i18n`.
* Users can toggle language, which persists in localStorage.

## 🚀 Building for Production

To build the frontend for deployment:

```bash
npm run build
```

The output will be in `frontend/dist`. These static files are served by the Rust backend in production.
