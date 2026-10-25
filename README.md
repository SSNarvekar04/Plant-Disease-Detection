# Plant Disease Detection & Remedy Recommendation System

A full-stack web application that diagnoses plant leaf disease from a photograph
and returns a practical remedy plan. Upload an image, get the plant species, the
most likely disease with a confidence score, and read the matching symptoms,
causes, chemical treatment, organic remedies and prevention checklist.

The diagnosis itself is performed by the **[Plant.id](https://plant.id/) API**,
called from a Node.js backend. The API key lives only in `backend/.env` and never
reaches the browser. Every stored result is marked `predictionSource: "plant.id"`
— there is no mock classifier and no invented confidence anywhere in the flow.

---

## Table of contents

1. [Problem statement](#problem-statement)
2. [Objectives](#objectives)
3. [Architecture](#architecture)
4. [How a prediction works](#how-a-prediction-works)
5. [Technology](#technology)
6. [Project structure](#project-structure)
7. [Setup](#setup)
8. [Running the application](#running-the-application)
9. [Demo accounts](#demo-accounts)
10. [API reference](#api-reference)
11. [Database design](#database-design)
12. [Plant.id setup](#plantid-setup)
13. [Testing](#testing)
14. [Configuration](#configuration)
15. [Screenshots](#screenshots)
16. [Troubleshooting](#troubleshooting)
17. [Future scope](#future-scope)
18. [Disclaimer](#disclaimer)

---

## Problem statement

Small and marginal farmers usually spot a problem on a leaf long before they can
get an expert to look at it. Getting a diagnosis means either travelling to an
agricultural extension office or waiting days for a laboratory result, and by
then the infection has often spread. Existing mobile apps either identify the
plant only, or stop at a disease name with no guidance on what to actually do.

The result is a gap between **detection** and **action**: a farmer who can see
the damage but cannot translate it into a treatment decision.

This project closes that gap in one place. A single photograph produces a
diagnosis **and** a structured remedy plan — symptoms to confirm the problem,
causes that explain how it spread, chemical treatment for immediate control,
organic alternatives for low-residue farming, and prevention steps for the next
season — together with a personal history so recurring problems become visible.

---

## Objectives

1. **Diagnose from a photograph.** Accept a leaf image in the browser, validate
   it, store it, and return the plant species, the most likely disease and a
   confidence score.
2. **Use a real AI provider, honestly.** Integrate the Plant.id API as the sole
   diagnosis engine, keep the API key server-side, and label every result with
   `predictionSource: "plant.id"`. When the provider is unreachable the API
   returns a clear 503 message instead of fabricating a result.
3. **Turn a disease name into advice.** Match the diagnosis to a curated
   knowledge base so every result carries symptoms, causes, severity, organic
   remedies, chemical treatment, precautions and prevention.
4. **Keep a trustworthy history.** Persist every scan per user so dashboards can
   show what keeps recurring, and let users revisit or delete their own records.
5. **Support administration.** Let an admin manage users, manage the disease
   catalogue, review all predictions and check whether the AI provider is live.
6. **Be secure and deployable.** JWT authentication, bcrypt password hashing,
   role-based access, rate limiting, input validation, and image storage that
   works on local disk out of the box and on Cloudinary when configured.

---

## Architecture

```
┌───────────────────────────────┐
│  React + Vite (port 5173)     │
│  React Router · Axios · Tailwind │
│  pages/ components/ services/  │
└──────────────┬────────────────┘
               │  HTTPS/JSON  (VITE_API_URL=http://localhost:5000/api)
               │  Bearer JWT on every private call
┌──────────────▼────────────────────────────────────────────┐
│  Node.js + Express (port 5000)                            │
│                                                            │
│  routes/       auth · users · diseases · predictions · admin │
│  middleware/   auth (JWT) · roles · upload (Multer) · rate limit │
│  controllers/  request/response shaping                    │
│  services/     plantIdService · diseaseMatchService · cloudinaryService │
│  models/       User · Disease · Prediction (Mongoose)      │
│  data/         diseaseCatalogue.js  (29 curated records)   │
└───────┬───────────────────┬──────────────────┬─────────────┘
        │                   │                  │
        │ HTTPS             │ MongoDB          │ HTTPS
        ▼                   ▼                  ▼
┌───────────────┐   ┌──────────────┐   ┌──────────────────┐
│  Plant.id API │   │  MongoDB     │   │  Cloudinary or   │
│  /v3/identifi-│   │  users,      │   │  backend/uploads │
│  cation       │   │  diseases,   │   │  (local disk)    │
│               │   │  predictions │   │                  │
└───────────────┘   └──────────────┘   └──────────────────┘
```

Design decisions worth knowing:

- **The AI call happens before the image is stored.** If Plant.id is down there
  is no orphaned file left on disk.
- **`plantIdService` is the only module that talks to Plant.id.** It maps every
  provider failure (401/402/403, timeout, network) onto a friendly 503, so the
  API key and internal errors never reach the client.
- **Images are not stored in MongoDB.** They live on disk (or Cloudinary) and
  only the URL is saved, which keeps documents small and backups easy.
- **`ml-service/` is legacy.** The original Python/TensorFlow classifier is no
  longer used by anything; it stays in the repository only as history.

---

## How a prediction works

```
Browser                 Express                    Plant.id              MongoDB
   │                       │                          │                     │
   │ POST /api/predictions │                          │                     │
   │  multipart: image     │                          │                     │
   ├──────────────────────►│                          │                     │
   │                       │  1. auth + rate limit    │                     │
   │                       │  2. Multer validates     │                     │
   │                       │     type, size, magic    │                     │
   │                       │                          │                     │
   │                       │ POST /v3/identification  │                     │
   │                       │  images: [base64]        │                     │
   │                       │  health: "all"           │                     │
   │                       │  classification_level:   │                     │
   │                       │          "species"       │                     │
   │                       ├─────────────────────────►│                     │
   │                       │◄─── classification.suggestions (species)       │
   │                       │◄─── disease.suggestions  (name + probability)  │
   │                       │◄─── is_healthy, is_plant, model_version        │
   │                       │                          │                     │
   │                       │  3. upload the image     │                     │
   │                       │     (Cloudinary/local)   │                     │
   │                       │                          │                     │
   │                       │  4. match top-1 suggestion against the         │
   │                       │     disease catalogue (see below)              │
   │                       │                          │                     │
   │                       │ POST /api/predictions    │                     │
   │                       ├───────────────────────────────────────────────►│
   │◄── 201 prediction + disease record + disclaimer                        │
```

### Species → crop

Plant.id answers with scientific names (`Solanum lycopersicum`), while the
knowledge base is organised by the crop name a farmer uses (`Tomato`).
`plantIdService.resolvePlant()` maps one onto the other for the seven crops the
catalogue covers: Tomato, Potato, Apple, Grape, Pepper, Strawberry and Corn.
An unknown species is shown verbatim rather than guessed.

### Disease matching

Only the **top-1** suggestion may name the result, because the stored confidence
belongs to that suggestion. Naming the result after a lower-ranked alternative
would attach a number nobody measured to a disease Plant.id did not score that
high. The order used by `diseaseMatchService` is:

1. crop + disease name (exact, case-insensitive)
2. crop + partial disease name (`"leaf blight"` vs `"leaf blight (isariopsis…)"`)
3. crop + `pathogenType` — Plant.id reports the causal organism
   (`Phytophthora`, `Begomovirus`, `Septoria`), and every catalogue record stores
   the same organism in `pathogenType`, so this is a taxonomic match, not a guess
4. normalised `mlLabels` match (PlantVillage-style label)
5. disease name alone, only when it is unique across the catalogue
6. **no match** → the prediction is still saved, but the response carries
   `remedyNotice` explaining that no remedy record exists yet

A healthy leaf short-circuits to the `Healthy` record with Plant.id's own
probability for the health verdict.

### Honesty rules

| Situation | What the API returns |
|---|---|
| Plant.id succeeds | `predictionSource: "plant.id"`, real probability as `confidence` |
| Plant.id times out / 5xx / network error | `503` — *"AI prediction service is temporarily unavailable. Please try again later."* |
| `PLANT_ID_API_KEY` missing | `503` — *"AI prediction service is not configured. Set PLANT_ID_API_KEY in backend/.env and restart the server."* |
| Out of credits (402) | `503` — *"AI prediction service quota has been exhausted."* |
| Image is not a plant | `400` — asks the user for a clearer leaf photo |
| No catalogue record matched | `201` prediction + `remedyNotice`, no invented treatment plan |
| Confidence below the threshold | `predictionStatus: "low_confidence"` + a warning in `message` |

There is no fallback classifier. A failed call is reported as a failure.

---

## Technology

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18, Vite, JavaScript (JSX) | Fast dev server, simple build |
| Routing | React Router v6 | Declarative routes, protected routes |
| Styling | Tailwind CSS | Utility-first, dark mode via class |
| HTTP | Axios | One configured instance, interceptors |
| Charts | Chart.js (react-chartjs-2) | Admin and user dashboards |
| Backend | Node.js, Express | Straightforward REST API |
| Database | MongoDB + Mongoose | Flexible documents for nested remedy plans |
| Auth | JWT + bcryptjs | Stateless tokens, hashed passwords |
| Uploads | Multer (memory) + Cloudinary | Stream to storage, local-disk fallback |
| Rate limiting | express-rate-limit | Protect auth and prediction endpoints |
| AI provider | **Plant.id API v3** | Species classification + health assessment |
| Validation | Manual per-route validators | Clear, field-level messages |

### Prerequisites

| Tool | Version used | Notes |
|---|---|---|
| Node.js | 18+ (tested on 24.15) | ships with `npm` |
| MongoDB | 6/7 or Atlas | local `mongod` or a free Atlas cluster |
| Browser | any modern evergreen browser | |

---

## Project structure

```
Plant Disease Detection/
├── README.md
├── .gitignore
├── backend/
│   ├── server.js              app bootstrap: middleware, routes, health, errors
│   ├── seed.js                demo users, 29 disease records, sample history
│   ├── package.json            start · dev · seed · test · test:integration
│   ├── .env.example            copy to .env and fill in
│   ├── config/
│   │   ├── env.js              typed config, reads .env once
│   │   └── db.js               Mongoose connection
│   ├── middleware/
│   │   ├── authMiddleware.js   protect / requireRole
│   │   ├── uploadMiddleware.js Multer + magic-byte image validation
│   │   ├── rateLimitMiddleware.js
│   │   └── errorMiddleware.js  ApiError handler, 404, JSON errors
│   ├── routes/                 auth · users · diseases · predictions · admin
│   ├── controllers/
│   ├── services/
│   │   ├── plantIdService.js   the only Plant.id client
│   │   ├── diseaseMatchService.js
│   │   └── cloudinaryService.js  Cloudinary or local disk
│   ├── models/                 User.js · Disease.js · Prediction.js
│   ├── data/diseaseCatalogue.js  29 curated remedy records
│   ├── utils/                  helpers, response shapes
│   ├── tests/
│   │   ├── api.test.js         69 offline checks against a Plant.id stub
│   │   └── integration.test.js 6 live checks against the real Plant.id API
│   └── uploads/                local image storage (Cloudinary when configured)
├── frontend/
│   ├── vite.config.js          dev server + /api proxy
│   ├── .env                    VITE_API_URL=http://localhost:5000/api
│   ├── .env.example
│   └── src/
│       ├── App.jsx             routes
│       ├── main.jsx
│       ├── components/         Navbar, Footer, ImageUploader, PredictionCard,
│       │                       PredictionResultView, DiseaseCard, Modal, charts
│       ├── pages/              Home, About, DetectDisease, PredictionResult,
│       │                       PredictionHistory, UserDashboard, DiseaseLibrary,
│       │                       DiseaseDetails, Login, Register, UserProfile,
│       │                       NotFound, admin/*
│       ├── services/api.js     the single Axios instance
│       ├── utils/              constants (badges, colours), formatters
│       └── styles/             Tailwind entry point
├── ml-service/                 LEGACY — no longer called by the app
└── docs/screenshots/           capture plan for the screenshots below
```

---

## Setup

### 1. Database

```bash
# local MongoDB
mongod

# or create a free cluster at https://cloud.mongodb.com and copy its connection string
```

### 2. Backend

```bash
cd backend
npm install
copy .env.example .env      # macOS/Linux: cp .env.example .env
```

Edit `backend/.env`:

- `MONGO_URI` — your connection string
- `JWT_SECRET` — generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `PLANT_ID_API_KEY` — see [Plant.id setup](#plantid-setup)

Then seed and start:

```bash
npm run seed                # demo users, diseases, sample history
npm run dev                 # http://localhost:5000
```

`npm run seed:fresh` wipes users, diseases and predictions first — use it to
reset the database back to a clean demo state.

### 3. Frontend

```bash
cd frontend
npm install
copy .env .env               # if the file was not created for you
npm run dev                  # http://localhost:5173
```

### 4. Cloudinary (optional)

Leave the three Cloudinary variables empty and images are written to
`backend/uploads/`. Fill them in and images go to Cloudinary instead; nothing
else changes.

---

## Running the application

Exactly two processes are needed:

```bash
# terminal 1 — backend
cd backend
npm run dev                  # http://localhost:5000

# terminal 2 — frontend
cd frontend
npm run dev                  # http://localhost:5173
```

Open **http://localhost:5173**.

> The Vite dev server also proxies `/api` and `/uploads`, so both
> `VITE_API_URL=/` and `VITE_API_URL=http://localhost:5000/api` work. The
> `.env` file uses the absolute URL; CORS on the backend already allows
> `http://localhost:5173`.

Useful endpoints:

| URL | Purpose |
|---|---|
| http://localhost:5000/api/health | service health, prediction provider, DB state |
| http://localhost:5000/api/admin/ml-health | Plant.id reachability (admin, no credits spent) |
| http://localhost:5173 | the app |

Production build:

```bash
cd frontend && npm run build     # outputs frontend/dist
cd backend  && npm start         # nodemon off, NODE_ENV=production
```

---

## Demo accounts

Created by `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@plantdisease.com` | `Admin@123` |
| User | `ravi@example.com` | `User@123` |
| User | `priya@example.com` | `User@123` |
| User | `amit@example.com` | `User@123` |

Change `SEED_ADMIN_PASSWORD` before seeding anything you care about.

---

## API reference

Base URL: `http://localhost:5000/api`. Private routes need
`Authorization: Bearer <token>`.

### Health

| Method | Path | Notes |
|---|---|---|
| `GET` | `/health` | `database`, `storage`, `predictionProvider`, `predictionServiceConfigured` |

### Auth — `/api/auth`

| Method | Path | Notes |
|---|---|---|
| `POST` | `/register` | `name`, `email`, `password`, `confirmPassword` |
| `POST` | `/login` | returns `{ user, token, expiresIn }` |
| `POST` | `/logout` | client drops the token |
| `POST` | `/verify-token` | validates a stored token |
| `GET` | `/me` | current user |
| `GET` | `/role-check` | role probe |

### Users — `/api/users`

| Method | Path | Notes |
|---|---|---|
| `GET` | `/profile` | profile + own scan/disease counts |
| `PUT` | `/profile` | name, phone, location, avatar |
| `PUT` | `/password` | requires current password |
| `PUT` | `/email` | requires current password |
| `DELETE` | `/profile` | deletes the account and its history |

### Diseases — `/api/diseases`

| Method | Path | Notes |
|---|---|---|
| `GET` | `/` | paginated, filter by `search`, `plant`, `severity`, `sort` |
| `GET` | `/plants` | distinct crops + severities for filters |
| `GET` | `/:id` | one record |
| `POST` | `/` | admin |
| `PUT` | `/:id` | admin |
| `DELETE` | `/:id` | admin |

### Predictions — `/api/predictions`

| Method | Path | Notes |
|---|---|---|
| `POST` | `/` | multipart field **`image`** → runs Plant.id and saves history |
| `GET` | `/my` | own history, paginated, filter by `plant`, `status`, `search` |
| `GET` | `/stats/my` | `totalScans`, `statusCounts`, `topDiseases`, `plantBreakdown` |
| `GET` | `/:id` | full result: prediction + disease record + disclaimer |
| `DELETE` | `/:id` | removes one of your scans |

### Preview — `/api/predict`

| Method | Path | Notes |
|---|---|---|
| `POST` | `/` | same analysis, **does not** write to history |

### Admin — `/api/admin`

| Method | Path | Notes |
|---|---|---|
| `GET` | `/statistics` | counters, status breakdown, charts |
| `GET` | `/ml-health` | Plant.id reachable, latency, endpoint, key configured |
| `GET` | `/users` | list with scan counts, search |
| `POST` | `/users` | create a user |
| `GET` | `/users/:id` | one user |
| `PUT` | `/users/:id` | role / active / profile |
| `DELETE` | `/users/:id` | removes user and history |
| `GET` | `/predictions` | all predictions, filters |
| `DELETE` | `/predictions/:id` | remove any prediction |

### Rate limits

| Scope | Limit |
|---|---|
| `/api/auth/*` | 20 requests / 15 min per IP |
| prediction endpoints | 15 requests / min per IP |

---

## Database design

Three collections.

### `users`

| Field | Type | Notes |
|---|---|---|
| `name` | String | 3–80 chars |
| `email` | String | unique index, lowercased |
| `password` | String | bcrypt hash, `select: false`, never serialised |
| `role` | enum `user` \| `admin` | indexed |
| `phone`, `location`, `avatarUrl` | String | optional profile |
| `isActive` | Boolean | soft disable |
| `lastLoginAt` | Date | |
| `createdAt`, `updatedAt` | Date | from `timestamps` |

Indexes: `email` (unique), `role`, `createdAt`.

### `diseases`

The remedy knowledge base — 29 records covering all the crops the app detects.

| Field | Type | Notes |
|---|---|---|
| `diseaseName` | String | e.g. `Late Blight` |
| `plantName` | String | crop, e.g. `Tomato` |
| `description` | String | plain-language explanation |
| `symptoms` | [String] | how to confirm it in the field |
| `causes` | [String] | how it spreads |
| `severity` | enum | drives UI badges and filters |
| `organicRemedies` | [String] | chemical-free control |
| `chemicalTreatment` | [String] | labelled products and timing |
| `prevention` | [String] | next-season practices |
| `precautions` | [String] | safety notes when spraying |
| `mlLabels` | [String] | PlantVillage-style labels, used by matcher step 4 |
| `pathogenType` | String | causal organism, used by matcher step 3 |
| `favourableConditions` | String | weather/conditions that trigger it |
| `imageUrl`, `isActive` | | |

### `predictions`

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → `users` | indexed |
| `imageUrl` | String | Cloudinary URL or `http://…/uploads/…` |
| `publicId` | String | Cloudinary public id (empty for local disk) |
| `plantName` | String | resolved crop |
| `diseaseName` | String | catalogue name if matched, otherwise Plant.id's wording |
| `confidence` | Number | **0–100**, the top-1 probability from Plant.id |
| `predictionSource` | enum `plant.id` \| `manual` | `manual` only for seeded sample rows |
| `predictionStatus` | enum `healthy` \| `detected` \| `low_confidence` | |
| `disease` | ObjectId → `diseases` | `null` when nothing matched |
| `rawResult` | Mixed | model version, species, `isHealthy`, `topPredictions` |
| `notes` | String | human-readable message shown on the result |
| `createdAt` | Date | indexed |

Indexes: `user`, `createdAt`, `disease`, `predictionStatus`.

---

## Plant.id setup

1. Create an account at **<https://plant.id/>** and open the dashboard.
2. Create an API key and copy it.
3. Put it in **`backend/.env` only**:

   ```env
   PLANT_ID_API_KEY=your_real_key_here
   PLANT_ID_API_BASE_URL=https://api.plant.id/v3
   PLANT_ID_TIMEOUT_MS=45000
   ```

4. Restart the backend. Confirm it is wired up:

   ```bash
   curl http://localhost:5000/api/health
   ```

   ```json
   { "data": { "predictionProvider": "plant.id", "predictionServiceConfigured": true } }
   ```

   ```bash
   curl http://localhost:5000/api/admin/ml-health -H "Authorization: Bearer <admin token>"
   ```

   ```json
   { "data": { "reachable": true, "latencyMs": 250, "details": { "apiKeyConfigured": true } } }
   ```

Notes:

- **`health: "all"` costs 2 credits per request** (1 if the leaf is healthy).
  The health check endpoint deliberately sends no image, so it is free.
- The key is read server-side. It is never sent to the browser, never logged and
  never included in an error response.
- The tests do not need a key: `npm test` runs against a local HTTP stub that
  returns a realistic Plant.id payload. Only `npm run test:integration` makes a
  real, paid call.
- If the API changes shape, `backend/services/plantIdService.js` is the only file
  that needs to change.

---

## Testing

```bash
# Backend API suite — offline, needs only MongoDB
cd backend
npm test

# Live Plant.id integration — makes a real paid API call, skips if no key/image
TEST_IMAGE="C:\path\leaf.jpg" npm run test:integration

# Frontend
cd frontend
npm run lint
npm run build
```

**Backend suite — 69 checks.** Boots Express in-process against a local Plant.id
stub, so it verifies validation, auth, RBAC, CRUD, history, stats, rate limits
and error handling without spending credits:

- auth, profile, password and account deletion
- disease catalogue CRUD with admin-only guards
- prediction happy path, invalid files, ownership, history, stats
- the honesty rules: `predictionSource` is `plant.id`, the disclaimer is present,
  and a lower-ranked suggestion never renames the result or borrows its confidence
- admin statistics, user management, prediction moderation, Plant.id health

**Integration suite — 6 checks.** Registers a throwaway user, uploads a real
leaf photo, and asserts the live response: `predictionSource: "plant.id"`,
confidence equal to the provider's own value, a remedy record *or* the honest
"no remedy record" notice, dashboard aggregates and the disclaimer. It skips with
a clear message when `PLANT_ID_API_KEY` is unset or no image is supplied.

---

## Configuration

### `backend/.env`

| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `5000` | Express port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/plant_disease` | database |
| `JWT_SECRET` | long random hex | token signing |
| `NODE_ENV` | `development` \| `production` | also controls error stack traces |
| `CLIENT_URL` | `http://localhost:5173` | allowed CORS origin |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | | leave blank for local disk |
| `CLOUDINARY_FOLDER` | `plant-disease` | upload folder |
| `PLANT_ID_API_KEY` | | **server-side secret** |
| `PLANT_ID_API_BASE_URL` | `https://api.plant.id/v3` | override for tests |
| `PLANT_ID_TIMEOUT_MS` | `45000` | provider timeout |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | | seed script admin |

### `frontend/.env`

| Variable | Example | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | API base URL |
| `VITE_APP_NAME` | `Plant Disease Detection` | navbar and title |

Never put a secret in `frontend/.env` — everything there is shipped to the
browser.

---

## Screenshots

Capture instructions live in [`docs/screenshots/README.md`](docs/screenshots/README.md).

Planned shots: landing page, register/login, detection upload, result view with
confidence and alternatives, disease detail page, user dashboard, history,
profile, admin dashboard, admin disease CRUD, admin predictions, mobile layout.

---

## Troubleshooting

**`503 AI prediction service is temporarily unavailable`**
Plant.id could not be reached. Check connectivity, your remaining credits, and
`PLANT_ID_TIMEOUT_MS`. Restart the backend after editing `.env`.

**`503 AI prediction service is not configured`**
`PLANT_ID_API_KEY` is missing or blank. Fill it in and restart.

**`429` on login or on upload**
Rate limits: 20 auth requests / 15 min, 15 predictions / min. They are held
in memory, so restarting the backend clears them.

**Result says "no remedy record"**
Plant.id returned a name the catalogue does not contain (for example a generic
pathogen like `Erysiphaceae`). The prediction is stored correctly; an admin can
add a matching record under **Admin → Diseases**.

**CORS error in the browser**
`CLIENT_URL` in `backend/.env` must include `http://localhost:5173`, and the
backend must be restarted afterwards.

**Images 404 after re-seeding**
`npm run seed` recreates the sample images it references. Run it again if you
deleted files from `backend/uploads/`.

**`EADDRINUSE: port 5000 in use`**
Another backend is still running: `Get-NetTCPConnection -LocalPort 5000` and
stop that process, or set a different `PORT`.

---

## Future scope

- **Species-level remedies.** Plant.id sometimes answers with a pathogen genus
  (`Erysiphaceae`) the catalogue does not cover. Adding records for those, or
  asking the provider for a more specific disease model, would raise the match
  rate.
- **Offline / on-device inference.** A quantised model in the browser would let
  the app diagnose in low-connectivity areas and use Plant.id only as a fallback.
- **Multi-language guidance.** Localised remedy text and voice output for
  farmers who are not comfortable reading English.
- **Field-level scanning.** Multiple leaves per plant, severity scoring from
  image segmentation, and a time-series view of how an infection progresses.
- **Advisory notifications.** Alert a user when a disease they previously
  recorded returns in favourable weather.
- **Pesticide residue and resistance data.** Attach withdrawal periods and
  resistance-management notes to chemical recommendations.
- **Push to real farms.** An offline-first PWA plus a WhatsApp/SMS channel so
  the same diagnosis can be delivered without a smartphone browser.
- **Model evaluation harness.** Compare Plant.id's answers against a labelled
  local dataset to report precision/recall per crop.

---

## Disclaimer

This application is an academic project. Predictions are produced by the Plant.id
API and are an aid for decision making only — **not** a certified agronomic
diagnosis. Always confirm a result with a local agriculture expert before
applying any treatment, and follow the pesticide label in your jurisdiction.
