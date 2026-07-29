# React Frontend Architecture Guide

This document defines the proposed directory structure, architecture, and design patterns for the React frontend of the School Management System.

## Directory Structure

```text
frontend/
├── public/
├── src/
│   ├── assets/             # Images, fonts, SVG icons
│   ├── components/         # Reusable global UI elements
│   │   ├── common/         # Atomic UI (Button, Input, Table, Badge, Spinner)
│   │   ├── layout/         # Shell layout (Navbar, Sidebar, Footer, PageWrapper)
│   │   └── feedback/       # Alerts, Modals, Toast notifications
│   ├── context/            # Global React Contexts (AuthContext, ThemeContext)
│   ├── hooks/              # Custom React Hooks
│   │   ├── useAuth.js      # Global authentication controls
│   │   ├── useFetch.js     # Generic fetch wrapper with loading/error states
│   │   └── useResults.js   # Results manipulation and caching hooks
│   ├── pages/              # Routed pages grouped by role/feature
│   │   ├── auth/           # Login.jsx, ForgotPassword.jsx
│   │   ├── admin/          # Users.jsx, Classes.jsx, Subjects.jsx, Students.jsx
│   │   ├── teacher/        # ResultsEntry.jsx, MySubjects.jsx
│   │   ├── exam-officer/   # ResultsApproval.jsx, ClassReports.jsx
│   │   └── Dashboard.jsx   # Shared dashboard landing with role-conditional components
│   ├── services/           # API integration layer (Axios clients and services)
│   │   ├── api.js          # Main Axios instance with request/response interceptors
│   │   ├── authService.js  # Login, logout, profile fetches
│   │   ├── resultService.js# Store, update, fetch results
│   │   └── studentService.js
│   ├── utils/              # Helper utilities (formatters, math, grading helpers)
│   ├── App.jsx             # Main routing switcher
│   ├── index.css           # Global Tailwind/CSS rules
│   └── main.jsx            # Application entrypoint
├── package.json
└── vite.config.js
```

## Architectural Guidelines

### 1. Component Design
- Reusable visual elements live in `components/common/` and should be pure, presentation-only components (receiving data and callbacks via props).
- Style components using vanilla CSS modules or Tailwind utility classes. Make them accessible (semantic HTML, `aria-*` tags, focus management).
- Pages in `pages/` handle data fetching (using services and hooks) and route state.

### 2. State & Data Fetching
- **Authentication**: Managed globally using `AuthContext`. Stored tokens should use `localStorage` or `HttpOnly` cookie-based sessions synced via Axios interceptors.
- **Query Caching**: Use a service wrapper or standard custom hooks (e.g., custom `useFetch` or React Query/SWR) to handle caching, background revalidation, and loading/error states.

### 3. API Communication (`services/`)
- All requests run through a centralized Axios client in `services/api.js`.
- An authorization interceptor automatically attaches the Sanctum bearer token (`Authorization: Bearer <token>`) from storage if present.
- A response interceptor handles standard HTTP errors (e.g., redirecting to login on `401 Unauthorized` or showing notifications on `500 Server Error`).

## Key Screens & Modules
1. **Login Page (`pages/auth/Login.jsx`)**: Responsive form with validation, submitting credentials to `/api/login`.
2. **Dashboard (`pages/Dashboard.jsx`)**: Main landing page with unified layout, displaying stats tailored to the user's role (Admin, Teacher, Exam Officer).
3. **Teacher Portal (`pages/teacher/ResultsEntry.jsx`)**: Gradebook table allowing teachers to input CA (30/40) and Exam (60/70) scores, calculating the total and grade on the fly before saving to `/api/teacher/results`.
4. **Approval Panel (`pages/exam-officer/ResultsApproval.jsx`)**: Interface for Exam Officers to view pending results, filter by Class/Subject, and click Approve or Reject (which updates the database status via POST requests).
5. **Admin Panels (`pages/admin/*`)**: CRUD tables for managing the school resources (Users, Classes, Subjects, Students).
