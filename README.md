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
- 🔒 **Razorpay payments**: ₹500 token reservations + full purchases (token deducted), HMAC signature verification, owner confirmation with 2% commission, owner/admin token refunds via the Razorpay refund API (with chunked fallback for test-mode credit limits)
- 💬 **Payment updates in chat**: token paid / full paid / confirmed / refunded events post system messages into the buyer–owner conversation, and notifications deep-link to the relevant dashboard section (payments, visits, listings)
- ❤️ Favorites, compare up to 2 properties, similar properties, trending, view counters
- 🌙 Dark mode, infinite scroll, lazy images, lazy-loaded routes (code splitting), responsive design
- 📲 **PWA**: installable (manifest + icons), offline shell, API/upload runtime caching (Workbox)
- 🛡️ Security hardening: Helmet, rate limiting, mongo-sanitize, HPP protection
- 🧪 **API test suite** (Vitest + Supertest, 25 tests)

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
| POST | `/api/payments/create-order` | user | Razorpay order (token ₹500 or full, token-deducted) |
| POST | `/api/payments/verify` | user | HMAC signature verification → `paid` |
| POST | `/api/payments/:id/confirm` | owner/admin | Confirm full payment → property sold, 2% commission |
| POST | `/api/payments/:id/refund` | owner/admin | Refund paid token via Razorpay refund API → `refunded` |
| GET | `/api/payments/my` | user | Buyer's payments |
| GET | `/api/payments/owner` | owner/admin | Owner's payments + payout |
| GET | `/api/payments/all` | admin | All platform payments + commission total |
| GET | `/api/analytics/*` | admin | Platform analytics |
| GET | `/api/analytics/owner` | owner | Owner analytics |
| GET | `/api/users`, `PUT /api/users/:id/block` | admin | User management |

## 💳 Payments (Razorpay)

**Flow:** buyer reserves with a ₹500 token, or buys outright (previously paid token is deducted). `verify` checks the HMAC signature server-side before marking `paid`. Full payments need owner confirmation (Confirm button in Payouts & Earnings) → property marked `sold`, 2% admin commission computed, owner payout stored. Token refunds (owner or admin, from the dashboard) call the Razorpay refund API and notify the buyer. Every event also posts a system message into the buyer–owner chat and deep-links its notification to the right dashboard section.

**Test mode recipe** (card payments):
- Mobile: `9876501234` (Razorpay blocklists dummy numbers like `9876543210`)
- Card: `5267 3181 8797 5449` (Mastercard success) — the Visa test card `4111 1111 1111 1111` is rejected as "international" on newer checkouts
- Expiry `11/40`, CVV `123`, OTP `1234` (must be 4–10 digits; shorter OTPs fail deliberately)

**Test-mode notes:** captured payments don't add to the dashboard "Collected" balance (no settlement in test mode), and refunds are backed by a limited credit line — a large refund may need to be issued in chunks (the app retries automatically) or from the Razorpay Dashboard. Live mode behaves normally.

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
| Razorpay payments (token, full, refunds) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |

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
- [x] **Phase 7 — Payments v2:** full purchases (token-deducted), owner confirmation + commission, owner/admin refunds, payment system messages in chat, notification deep-links to dashboard sections, nodemon dev workflow

## 🧪 Known Notes
- Email features activate when SMTP credentials are set in `.env`
- Without Cloudinary credentials, uploads are stored locally in `server/uploads`
- Port 5001 is used by default (5000 is often occupied by macOS AirPlay)
- Dev workflow: `npm run dev -w server` (nodemon auto-restarts on save) + `npm run dev -w client` (Vite HMR)

## 📄 License
MIT
