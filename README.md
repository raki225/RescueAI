<div align="center">

# 🚑 RescueAI

### AI‑Powered Emergency Medical Triage Assistant

Describe your symptoms (or upload a photo) and get an instant, AI‑backed severity
assessment, guided first aid, the nearest emergency‑ready hospitals, and a
printable hand‑off report — in under 30 seconds.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Backend](https://img.shields.io/badge/backend-Node%20%2B%20Express%20%2B%20TS-informational)
![Frontend](https://img.shields.io/badge/frontend-React%2018%20%2B%20Vite-61dafb)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-8e44ad)

</div>

> ⚠️ **Medical disclaimer** — RescueAI is a decision‑support and first‑aid guidance
> tool. It is **not** a substitute for professional medical care. In a
> life‑threatening emergency call **108 / 112** (India) or your local emergency
> number immediately.

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🩺 | **AI Symptom Triage** | Describe symptoms in plain language and receive a severity assessment with a **0–100 risk score**, confidence rating, and likely conditions. |
| 📸 | **Medical Image Analysis** | Upload a photo of a rash, burn, cut, bite, swelling, etc. Gemini Vision analyses it (with a rule‑based fallback) and folds findings into the triage. |
| ❓ | **Adaptive Follow‑up Questions** | Dynamic, symptom‑specific questions refine the assessment. Red‑flag answers escalate straight to **EMERGENCY**. |
| 🏥 | **Nearest Hospitals** | Locate emergency‑ready facilities by live GPS, sorted by distance and ETA, filterable by ownership (government/private) and service. |
| ❤️ | **Guided First Aid** | Step‑by‑step, bystander‑safe instructions tailored to the emergency type. |
| 💊 | **Medicine Suggestions** | Vetted OTC self‑care suggestions, plus explicit *“avoid”* warnings. |
| 📄 | **Emergency Report** | One‑tap, printable report for a fast, accurate hospital hand‑off. |
| 🗺️ | **Maps & Geocoding** | Google Maps Platform when a key is present, otherwise a fully key‑less **OpenStreetMap** (Nominatim + Overpass) fallback. |

The app is **fully functional without any API keys** — it gracefully falls back to
a rule‑based triage engine and OpenStreetMap.

---

## 🧱 Tech Stack

**Frontend**
- React 18 + TypeScript + [Vite](https://vitejs.dev/)
- Tailwind CSS + Framer Motion (animations)
- React Router, Zustand (state)
- Leaflet / React‑Leaflet + marker clustering (maps)

**Backend**
- Node.js + Express + TypeScript
- MongoDB via Mongoose
- Google Gemini (`gemini-flash-latest`) with a rule‑based fallback engine
- Helmet, CORS, compression, express‑rate‑limit, Joi validation, Winston logging

---

## 📁 Project Structure

```
RescueAI/
├── backend/                     # Express + TypeScript API
│   ├── src/
│   │   ├── app.ts               # Express app (middleware, routes)
│   │   ├── server.ts            # Bootstrap: DB connect, seed, listen
│   │   ├── config/              # env + database config
│   │   ├── controllers/         # triage, hospital, report, geo, health
│   │   ├── routes/v1/           # /api/v1 route definitions
│   │   ├── models/              # TriageSession, Hospital, EmergencyReport
│   │   ├── services/
│   │   │   ├── ai/              # Gemini, image analysis, first-aid, prompts
│   │   │   ├── maps/            # geocode, places, hospital locator
│   │   │   └── triage/          # engine, risk scoring, severity, protocols
│   │   ├── middleware/          # logging, rate limit, error handling
│   │   ├── data/                # hospital seed data
│   │   └── types.ts             # shared domain types
│   └── package.json
│
└── frontend/                    # React + Vite client
    ├── src/
    │   ├── App.tsx              # routes & layout
    │   ├── pages/               # Landing, Triage, Results, Hospitals, FirstAid, Report
    │   ├── components/          # layout + common UI
    │   ├── hooks/  store/  services/  utils/  styles/
    │   └── main.tsx
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** (20 LTS recommended)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI
- *(optional)* Google **Gemini** API key for AI triage
- *(optional)* Google **Maps Platform** key for Google‑powered maps

### 1. Clone & install

```bash
git clone <your-repo-url> RescueAI
cd RescueAI

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

Copy the example env files and fill in values (all secrets are optional):

```bash
# from the backend/ folder
cp .env.example .env

# from the frontend/ folder
cp .env.example .env
```

**`backend/.env`**

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `4000` | API port |
| `HOST` | `127.0.0.1` | API host |
| `CLIENT_ORIGIN` | `http://localhost:5180` | Allowed CORS origin (the frontend) |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/rescueai` | MongoDB connection string |
| `GEMINI_API_KEY` | *(empty)* | Google Gemini key — **empty = rule‑based fallback** |
| `GEMINI_MODEL` | `gemini-flash-latest` | Gemini model name |
| `GOOGLE_MAPS_API_KEY` | *(empty)* | Server‑side Maps key — **empty = OpenStreetMap** |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate‑limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `LOG_LEVEL` | `info` | Winston log level |

**`frontend/.env`**

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | API base (proxied to the backend in dev) |
| `VITE_GOOGLE_MAPS_API_KEY` | *(empty)* | Browser Maps key — empty = OpenStreetMap |

### 3. Run in development

```bash
# Terminal 1 — API (http://127.0.0.1:4000)
cd backend
npm run dev

# Terminal 2 — Web app (http://localhost:5180)
cd frontend
npm run dev
```

The Vite dev server proxies `/api` and `/health` to the backend on port `4000`,
so there are no CORS issues in development. On start, the backend connects to
MongoDB and seeds hospital data automatically.

---

## 📜 Scripts

**Backend** (`backend/`)

| Command | Description |
|---|---|
| `npm run dev` | Start API with hot reload (`tsx watch`) |
| `npm start` | Start API without watch |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run serve` | Run the compiled build (`node dist/server.js`) |
| `npm run seed` | Seed the hospital database |
| `npm test` | Run Jest tests |
| `npm run typecheck` | Type‑check without emitting |

**Frontend** (`frontend/`)

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (port 5180) |
| `npm run build` | Type‑check and build for production |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Type‑check only |

---

## 🔌 API Reference

Base URL: `http://127.0.0.1:4000` · API prefix: `/api/v1`

### Triage
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/triage/questions` | Get adaptive follow‑up questions for a symptom description |
| `POST` | `/api/v1/triage/analyze` | Analyse symptoms (+ optional image & answers) and return an assessment |
| `GET`  | `/api/v1/triage/:sessionId` | Fetch a stored triage session |

### Hospitals
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/hospitals/nearby?lat=&lng=&radiusKm=&ownership=&service=` | Nearby hospitals sorted by distance/ETA |
| `GET` | `/api/v1/hospitals/first-aid` | First‑aid knowledge base |

### Geo
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/geo/reverse?lat=&lng=` | Reverse geocode coordinates to an address |
| `GET` | `/api/v1/geo/search?q=` | Forward geocode / place search |
| `GET` | `/api/v1/geo/autocomplete?input=` | Place autocomplete suggestions |
| `GET` | `/api/v1/geo/directions?originLat=&originLng=&destLat=&destLng=` | Route directions |
| `GET` | `/api/v1/geo/distance-matrix?originLat=&originLng=&destinations=lat,lng;lat,lng` | Distance/ETA matrix |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/reports` | Create a printable emergency report |
| `GET`  | `/api/v1/reports/:reportId` | Fetch a stored report |

### System
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1` | API index / endpoint listing |

---

## 🧠 How Triage Works

1. **Describe** — the user types symptoms and can attach a photo.
2. **Clarify** — the engine returns adaptive follow‑up questions; certain answers
   are *red flags* that immediately force an **EMERGENCY** result.
3. **Analyse** — Gemini (or the rule‑based fallback) combines text, image findings,
   and answers into a composite **0–100 risk score**.
4. **Classify** — the score maps to a 4‑level band:
   `emergency` · `urgent` · `moderate` · `low`.
5. **Act** — the result includes recommended care, guided first aid, medicine
   suggestions, whether an ambulance/hospital is required, and nearby hospitals.

---

## 🔒 Security Note

The committed `.env.example` files currently contain **real‑looking API keys** for
Gemini and Google Maps. Before publishing this repository you should:

1. **Rotate/revoke** those keys in the respective Google Cloud consoles.
2. Replace the values in `*.env.example` with empty placeholders.
3. Ensure real `.env` files are git‑ignored (they already are).

Never commit live credentials to version control.

---

## 📄 License

Released under the **MIT License**.

---

<div align="center">
Built with ❤️ to help people get the right care, faster.
</div>
