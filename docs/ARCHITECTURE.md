# EstateHub – Project Documentation

## Architecture

```
Browser (React SPA)
   │  REST /api + WebSocket (Socket.io)
   ▼
Express API (server/) ──► MongoDB (Mongoose models)
   │
   ├── JWT auth middleware (role-based: buyer | owner | admin)
   ├── Multer uploads → Cloudinary (fallback: server/uploads)
   └── Socket.io (real-time chat rooms: user:<id>)
```

## Database Collections

| Collection | Key fields |
|---|---|
| `users` | name, email, password(hash), role, phone, profileImage, favorites[], isBlocked, isEmailVerified |
| `properties` | ownerId, title, description, price, type, purpose, area, bedrooms, bathrooms, city, state, coordinates, images[], video, amenities[], status, featured, views, rating |
| `reviews` | userId, propertyId, rating (1-5), comment, ownerReply |
| `visits` | buyerId, ownerId, propertyId, date, time, status (pending/accepted/rejected/rescheduled/completed/cancelled) |
| `conversations` | participants[2], property, lastMessage |
| `messages` | conversation, sender, receiver, message, read |
| `reports` | reporterId, targetType, targetId, reason, status |

## Property Status Flow

```
owner creates → pending → admin verifies → verified
                              ├→ rejected (owner can edit → pending again)
                              └→ sold / rented (admin marks)
```

## Socket.io Events

| Event | Direction | Payload |
|---|---|---|
| `message:new` | server → user:<receiver> | full message object |
| `typing` | client ↔ client | { conversationId, isTyping } |
| `connected` | server → socket | { userId } |

## Deployment Plan

- **Frontend:** `vercel --prod` (root `client/`, build `npm run build`)
- **Backend:** Render web service, start `npm start` (root `server/`)
- **Database:** MongoDB Atlas cluster, set `MONGO_URI` in Render env vars
- Set `CLIENT_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `SMTP_*` in the Render dashboard

## Env Vars (server/.env)

| Var | Purpose | Default |
|---|---|---|
| PORT | API port | 5001 |
| MONGO_URI | MongoDB connection string | mongodb://127.0.0.1:27017/estatehub |
| JWT_SECRET / JWT_EXPIRE | Token signing | dev-secret / 7d |
| CLOUDINARY_* | Cloud image/video storage | empty → local uploads |
| SMTP_* | Email verification / password reset / OTP | empty → console log |
| CLIENT_URL | CORS + email links | http://localhost:5173 |
