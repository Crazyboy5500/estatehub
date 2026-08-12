# 🏠 EstateHub – Modern Real Estate Management Platform

A production-style MERN full-stack real estate marketplace: buyers find and book properties, owners list and manage them, admins verify and moderate — with real-time chat, maps, analytics dashboards, and role-based access control.

## ✨ Features

### Roles
| Role | Capabilities |
|---|---|
| **Guest** | Browse, search, filter, view details & reviews |
| **Buyer / Tenant** | Favorites, visit booking, reviews, property comparison, direct messaging with owners |
| **Owner / Agent** | List/edit/delete properties, upload images & video, accept/reject/reschedule visits, owner analytics |
| **Admin** | Verify/reject listings, manage users (block/delete), resolve reports, platform-wide analytics |

### Highlights
- 🔐 JWT auth with bcrypt, email verification, forgot password, OTP login (Nodemailer) + Google OAuth (optional)
- 🏘️ Property CRUD with image **and video** upload (Multer + Cloudinary, local fallback), client-side image compression
- 🔎 Advanced search: keyword, city, price range, type, BHK, bathrooms, area, sorting — instant results
- 💬 Real-time chat between buyers and owners (Socket.io)
- 🔔 In-app notifications (visit requests, accept/reject/reschedule, messages, property status) with live socket delivery + unread badge
- 📅 Visit booking with accept / reject / reschedule workflow (reschedule modal with calendar + note)
- ⭐ Reviews with owner replies and aggregated property ratings
- 📊 Dashboards with Chart.js: properties by city, monthly listings, most viewed, most saved, revenue, visits
- 🗺️ Interactive maps (Leaflet) with **nearby places layer** (schools, hospitals, metro, parks via OpenStreetMap Overpass API)
- 🕶️ **360° virtual tours** (Pannellum) on properties with a panorama image
- 📄 **PDF brochure download** (jsPDF) with branded layout
- 💰 Mortgage EMI calculator, share property, download property sheet
- 🔒 **Razorpay token payments** (₹500 reservation) with signature verification (optional)
- ❤️ Favorites, compare up to 2 properties, similar properties, trending, view counters
- 🌙 Dark mode, infinite scroll, lazy images, lazy-loaded routes (code splitting), responsive design
- 📲 **PWA**: installable (manifest + icons), offline shell, API/upload runtime caching (Workbox)
- 🛡️ Security hardening: Helmet, rate limiting, mongo-sanitize, HPP protection
- 🧪 **API test suite** (Vitest + Supertest, 22 tests)

## 🧱 Tech Stack

**Frontend:** React 18 · Vite · React Router · Redux Toolkit · Tailwind CSS · Framer Motion · React Hook Form · Socket.io-client · Leaflet · Chart.js · jsPDF · Heroicons/Lucide

**Backend:** Node.js · Express · MongoDB (Mongoose) · JWT · Bcrypt · Multer · Cloudinary · Socket.io · Nodemailer · Helmet · Razorpay

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Install
```bash
git clone <your-repo-url> estatehub
cd estatehub
npm install
```

### 2. Configure environment
```bash
cp server/.env.example server/.env
# edit server/.env — set MONGO_URI (local default is fine), JWT_SECRET,
# optionally Cloudinary + SMTP credentials
```

### 3. Seed demo data (optional but recommended)
```bash
npm run seed
```

Demo accounts (password: `password123`):
- **Admin:** `admin@estatehub.dev`
- **Owner:** `owner1@estatehub.dev`
- **Buyer:** `buyer1@estatehub.dev`

### 4. Run (client + server)
```bash
npm run dev
```
- Frontend: http://localhost:5173
- API: http://localhost:5001

Or run separately:
```bash
npm run dev:server   # API on :5001
npm run dev:client   # Vite on :5173 (proxies /api)
```

### 5. Production build
```bash
npm run build        # builds client to client/dist (PWA assets included)
npm start            # serves API (static hosting left to Vercel/Render)
```

### 6. Test the PWA locally
```bash
cd client && npx vite preview --port 4173
# open http://localhost:4173 — Chrome shows the "Install" icon in the address bar
# (service worker is only generated for production builds, not `npm run dev`)
```

## 📁 Project Structure

```
estatehub/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Navbar, PropertyCard, SearchBar, home sections…
│   │   ├── pages/          # Home, Properties, Details, Auth…
│   │   ├── pages/dashboard/ # Buyer/Owner/Admin dashboards
│   │   ├── layouts/        # Main + Dashboard layouts
│   │   ├── redux/          # auth + ui slices
│   │   ├── services/       # Axios API clients
│   │   ├── hooks/          # useAuth, useSocket, useInfiniteScroll…
│   │   ├── utils/          # formatting, EMI calculator, image compression
│   │   └── routes/         # ProtectedRoute, role guards
│   └── vite.config.js      # dev proxy → :5001
├── server/                 # Express REST API
│   ├── config/             # env, db, cloudinary
│   ├── models/             # User, Property, Review, Visit, Message, Report
│   ├── controllers/        # auth, property, review, visit, message, user, analytics
│   ├── routes/             # /api/* routes
│   ├── middleware/         # auth (JWT + roles), upload (Multer), error handling
│   ├── services/           # email, cloudinary
│   ├── sockets/            # Socket.io chat
│   ├── seed/               # demo data seeder
│   └── uploads/            # local upload fallback
└── docs/                   # additional documentation
```

## 🔌 API Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Register |
| POST | `/api/auth/login` | public | Login |
| POST | `/api/auth/forgot-password` / `reset-password` | public | Password reset |
| POST | `/api/auth/request-otp` / `verify-otp` | public | OTP login |
| GET/PUT | `/api/auth/me` | user | Profile |
| POST | `/api/auth/favorites/:propertyId` | user | Toggle favorite |
| GET | `/api/properties` | public | Search + filter + paginate |
| GET | `/api/properties/:id` | public | Details (+views, reviews) |
| POST | `/api/properties` | owner/admin | Create (multipart upload) |
| PUT/DELETE | `/api/properties/:id` | owner/admin | Update / delete |
| PUT | `/api/properties/:id/status` | admin | Verify / reject / sold / rented |
| POST | `/api/reviews/property/:propertyId` | user | Review (once per user) |
| POST | `/api/visits/property/:propertyId` | user | Book visit |
| PUT | `/api/visits/:id` | owner | Accept / reject / reschedule |
| GET/POST | `/api/messages/conversations*` | user | Chat (Socket.io for live) |
| GET | `/api/notifications*` | user | Notifications + unread count |
| POST | `/api/payments/create-order` / `verify` | user | Razorpay token payments |
| GET | `/api/analytics/*` | admin | Platform analytics |
| GET | `/api/analytics/owner` | owner | Owner analytics |
| GET | `/api/users`, `PUT /api/users/:id/block` | admin | User management |

## 🧪 Tests
```bash
npm test -w server        # Vitest + Supertest (requires local MongoDB)
```

## 🐳 Docker Compose
One-command full stack (MongoDB + API + web on :8080):
```bash
docker compose up --build
```

## ☁️ Deployment
- **Frontend (Vercel):** `vercel.json` is included — deploy `client/` as a static site and point its API proxy to your Render API URL.
- **API (Render):** `render.yaml` defines `estatehub-api` (Node) + `estatehub-web` (static). Set `MONGO_URI`, `JWT_SECRET`, and optional SMTP/Cloudinary/Google/Razorpay vars in the dashboard.
- **MongoDB Atlas:** create a free cluster, copy the connection string into `MONGO_URI`, and whitelist the deploy IPs (0.0.0.0/0 for testing).

## 🔌 Optional Integrations
| Feature | Env vars |
|---|---|
| Google Login | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Emails (verification, reset, OTP) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| Cloudinary (image/video CDN) | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Razorpay token payments | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |

Without credentials, these features degrade gracefully (console log for emails, local uploads, disabled buttons with notices).

## 🗺️ Roadmap

- [x] **Phase 1 — Core:** Auth, property CRUD, image upload, search, details
- [x] **Phase 2 — UX:** Favorites, visit booking, reviews, filters, pagination/infinite scroll, responsive
- [x] **Phase 3 — Interactive:** Real-time chat, notifications, dashboards
- [x] **Phase 4 — Advanced:** Maps, comparison, EMI calculator, analytics, admin verification
- [x] **Phase 5 — Production:** Google OAuth, nearby places, 360° tours, PDF brochures, video upload, Razorpay payments, security hardening, tests, Docker Compose, deployment configs
- [x] **Phase 6 — PWA:** installable app (manifest, icons, service worker, offline shell)
- [x] **Phase 6 — TypeScript:** client fully migrated to TypeScript (strict, `tsc --noEmit` clean; `npm run lint` = typecheck)
- [x] **Phase 6 — i18n:** Hindi + English localization (language switcher in navbar, persisted choice, status badges; translation keys are strictly type-checked against the English catalog via `i18next` `CustomTypeOptions` + `strictKeyChecks`)

## 🧪 Known Notes
- Email features activate when SMTP credentials are set in `.env`
- Without Cloudinary credentials, uploads are stored locally in `server/uploads`
- Port 5001 is used by default (5000 is often occupied by macOS AirPlay)

## 📄 License
MIT
