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

## 📋 Table of Contents

- [✨ Features](#-features)
- [🧱 Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
- [📜 Scripts](#-scripts)
- [🔌 API Reference](#-api-reference)
- [🧠 How Triage Works](#-how-triage-works)
- [🗺️ Maps & Geocoding](#️-maps--geocoding)
- [🛡️ Security Note](#️-security-note)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Author](#-author)

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
- React Router, Zustand (state management)
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
    │   ├── hooks/               # custom React hooks
    │   ├── store/               # Zustand state stores
    │   ├── services/            # API service layer
    │   ├── utils/               # helper functions
    │   ├── styles/              # global styles
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

### Installation

#### 1. Clone the repository

```bash
git clone <your-repo-url> RescueAI
cd RescueAI
```

#### 2. Install backend dependencies

```bash
cd backend
npm install
```

#### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### Configuration

#### Backend Configuration

Copy the example env file and fill in values:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=4000
HOST=127.0.0.1
CLIENT_ORIGIN=http://localhost:5180

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/rescueai

# AI (Optional - leave empty for rule-based fallback)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-latest

# Maps (Optional - leave empty for OpenStreetMap)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

#### Frontend Configuration

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
# API
VITE_API_BASE_URL=/api/v1

# Maps (Optional - leave empty for OpenStreetMap)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Running the Application

#### Development Mode

**Terminal 1 - Backend API:**
```bash
cd backend
npm run dev
```
The API will run at `http://127.0.0.1:4000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
The web app will run at `http://localhost:5180`

The Vite dev server proxies `/api` and `/health` to the backend on port `4000`,
so there are no CORS issues in development. On start, the backend connects to
MongoDB and seeds hospital data automatically.

#### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

---

## 📜 Scripts

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API with hot reload (`tsx watch`) |
| `npm start` | Start API without watch |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run serve` | Run the compiled build (`node dist/server.js`) |
| `npm run seed` | Seed the hospital database |
| `npm test` | Run Jest tests |
| `npm run typecheck` | Type‑check without emitting |

### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5180) |
| `npm run build` | Type‑check and build for production |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Type‑check only |

---

## 🔌 API Reference

Base URL: `http://127.0.0.1:4000` · API prefix: `/api/v1`

### Triage Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/triage/questions` | Get adaptive follow‑up questions for a symptom description |
| `POST` | `/api/v1/triage/analyze` | Analyse symptoms (+ optional image & answers) and return an assessment |
| `GET`  | `/api/v1/triage/:sessionId` | Fetch a stored triage session |

### Hospital Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/hospitals/nearby?lat=&lng=&radiusKm=&ownership=&service=` | Nearby hospitals sorted by distance/ETA |
| `GET` | `/api/v1/hospitals/first-aid` | First‑aid knowledge base |

### Geo Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/geo/reverse?lat=&lng=` | Reverse geocode coordinates to an address |
| `GET` | `/api/v1/geo/search?q=` | Forward geocode / place search |
| `GET` | `/api/v1/geo/autocomplete?input=` | Place autocomplete suggestions |
| `GET` | `/api/v1/geo/directions?originLat=&originLng=&destLat=&destLng=` | Route directions |
| `GET` | `/api/v1/geo/distance-matrix?originLat=&originLng=&destinations=lat,lng;lat,lng` | Distance/ETA matrix |

### Report Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/reports` | Create a printable emergency report |
| `GET`  | `/api/v1/reports/:reportId` | Fetch a stored report |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
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

### Severity Levels

| Level | Score Range | Action |
|-------|-------------|--------|
| 🚨 **Emergency** | 80-100 | Call emergency services immediately |
| ⚠️ **Urgent** | 60-79 | Seek medical attention within 1-2 hours |
| ℹ️ **Moderate** | 30-59 | See a doctor within 24 hours |
| ✅ **Low** | 0-29 | Self-care at home, monitor symptoms |

---

## 🗺️ Maps & Geocoding

RescueAI supports two map providers:

### Google Maps Platform (Preferred)
- Requires API key in both frontend and backend
- Provides: Places Autocomplete, Directions, Distance Matrix, Street View
- Set `GOOGLE_MAPS_API_KEY` in both `.env` files

### OpenStreetMap (Fallback - No Key Required)
- Uses Nominatim for geocoding
- Uses Overpass API for POI (Point of Interest) searches
- Uses OSRM (Open Source Routing Machine) for directions
- Fully functional without any API keys
- Rate limited by OSM policies (1 request per second)

---

## 🛡️ Security Note

The committed `.env.example` files currently contain **real‑looking API keys** for
Gemini and Google Maps. Before publishing this repository you should:

1. **Rotate/revoke** those keys in the respective Google Cloud consoles.
2. Replace the values in `*.env.example` with empty placeholders.
3. Ensure real `.env` files are git‑ignored (they already are).

Never commit live credentials to version control.

### Security Best Practices

- Always use environment variables for sensitive data
- Implement rate limiting to prevent abuse
- Use Helmet.js for secure HTTP headers
- Validate all user inputs with Joi
- Sanitize user inputs before processing
- Log security events for monitoring

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit your changes:** `git commit -m 'Add amazing feature'`
4. **Push to the branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Write TypeScript with strict type checking
- Follow the existing code style (Prettier + ESLint)
- Write unit tests for new features
- Update documentation for API changes
- Test both with and without API keys

---

## 📄 License

This project is licensed under the **MIT License**.

Copyright © 2026 **Rakesh Sivala**

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 👨‍💻 Author

**Rakesh Sivala**

- GitHub: [@rakeshsivala](https://github.com/rakeshsivala)
- LinkedIn: [Rakesh Sivala](https://linkedin.com/in/rakeshsivala)

---

## 🙏 Acknowledgments

- [Google Gemini](https://deepmind.google/technologies/gemini/) for AI capabilities
- [OpenStreetMap](https://www.openstreetmap.org/) for free map data
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) communities
- All contributors who help make RescueAI better

---

<div align="center">

### Built with ❤️ by Rakesh Sivala to help people get the right care, faster.

**⭐ Star this repository if you found it useful!**

</div>
