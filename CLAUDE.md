# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Artisans du Maroc** — a full-stack platform connecting Moroccan artisans with customers. Features artisan profiles, product catalogs, search/discovery, ratings, multi-currency support, and an admin dashboard.

## Repository Structure

```
Artisant project/
├── Artisant-backend/     # Node.js/Express API (port 5000)
└── artisan-frontend/     # React SPA (port 3000, Create React App)
```

## Development Commands

### Backend
```bash
cd Artisant-backend
npm run dev     # nodemon (auto-reload on change)
npm start       # node server.js (no auto-reload)
```

### Frontend
```bash
cd artisan-frontend
npm start       # dev server on port 3000
npm run build   # production build
npm test        # Jest + React Testing Library
```

## Environment Configuration

**Backend** (`Artisant-backend/.env`): MySQL connection (`artisans_db`), Cloudinary credentials, Brevo SMTP API key.

**Frontend** (`artisan-frontend/.env`): `REACT_APP_API_URL=http://localhost:5000` (local) or Railway URL for production.

The frontend reads the API base URL from `artisan-frontend/src/config.js` which exports `API_URL`.

## Architecture

### Backend (`Artisant-backend/`)

Standard Express MVC layout:
- `server.js` — entry point, mounts all routes
- `config/db.js` — MySQL connection pool (`mysql2/promise`)
- `controllers/` — business logic (artisan, product, auth, admin, feedback)
- `routes/` — route definitions that map to controllers

**API prefix convention:** most routes are under `/api/`, artisan-specific routes are at `/api/` (no sub-prefix — see `artisanRoutes.js`).

Key route groups:
- `/api/auth` — register/login for clients and artisans, password reset
- `/api/products` — CRUD, ratings, visit tracking, recommendations
- `/api/admin` — dashboard stats, user management, artisan status
- `/api/feedback` — site-wide feedback widget
- `/api/categories`, `/api/top-cities`, `/api/artisans/search` — discovery

**File uploads:** Cloudinary via `multer-storage-cloudinary`. Images are stored in the `artisans_maroc` Cloudinary folder with automatic optimization (Sharp). The legacy `/uploads` static folder still exists but is no longer used for new uploads.

**Email:** Nodemailer configured with Brevo SMTP for password reset flows.

### Frontend (`artisan-frontend/src/`)

React Router SPA with role-based pages under `src/pages/`:
- `Home/` — landing page, search bar, artisan recommendations
- `Login/` — login and registration forms (client, artisan, admin)
- `artisan/` — artisan dashboard, product management, profile editing
- `client/` — browsing, artisan profiles, product detail pages
- `admin/` — admin dashboard with statistics and user management

**Global state / context:** `src/components/CurrencyContext.js` provides multi-currency support (MAD/USD/AED) via React context. Import with the `useCurrency` hook from `src/components/useCurrency.js`.

**Shared components:** `Header.js`, `Footer.js`, `FeedbackWidget.js` (floating feedback button used globally).

### Database Schema (MySQL — `artisans_db`)

Core tables: `artisans`, `clients`, `admins`, `products`, `product_gallery`, `categories`, `ratings`, `site_feedback`.

- Products belong to artisans via `artisan_id` and to categories via `category_id`.
- `product_gallery` supports both images and videos (`file_type` column).
- `artisans.status` can be `active` or `bloque` (admin-controlled).
- Visit tracking for recommendations is implicit in `productController.js`.

## Key Patterns

- **Authentication:** Session data (user ID, role) is stored client-side in `localStorage` after login. There is no JWT or server-side session — all protected routes rely on passing the ID from localStorage in request bodies/params.
- **Image uploads:** Always use the existing Cloudinary multer configuration in controllers. Do not reintroduce local file storage.
- **Password storage:** Passwords are currently stored in plain text. Do not extend this pattern to new features.
- **API calls in frontend:** All axios calls use `API_URL` from `src/config.js` as the base — never hardcode localhost URLs.
