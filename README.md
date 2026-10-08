# Plant Disease Detection & Remedy Recommendation System

An AI-assisted web application that identifies plant leaf diseases from a photo
and recommends a full remedy plan — symptoms, causes, organic and chemical
treatment, prevention and precautions.

The project is a complete three-tier application:

| Tier | Stack | Port | Folder |
| --- | --- | --- | --- |
| Frontend | React 18, Vite, Tailwind CSS | `5173` | `frontend/` |
| Backend | Node.js, Express, MongoDB, JWT | `5000` | `backend/` |
| ML service | Python, FastAPI, TensorFlow/Keras | `8000` | `ml-service/` |

---

## Table of contents

1. [Features](#features)
2. [Screenshots](#screenshots)
3. [How the prediction pipeline works](#how-the-prediction-pipeline-works)
4. [Technology](#technology)
5. [Prerequisites](#prerequisites)
6. [Project structure](#project-structure)
7. [Setup](#setup)
8. [Running the application](#running-the-application)
9. [Demo accounts](#demo-accounts)
10. [Training the model](#training-the-model)
11. [Testing](#testing)
12. [API reference](#api-reference)
13. [Configuration](#configuration)
14. [Troubleshooting](#troubleshooting)

---

## Screenshots

> **Coming soon.** Real screenshots are not committed yet. The planned capture
> list — file names, screens and routes — is documented in
> [`docs/screenshots/README.md`](docs/screenshots/README.md). Nothing is
> faked in the meantime.

---

## Features

### Public

- **Landing page** explaining the problem, the workflow and the supported crops.
- **Disease library** — searchable and filterable catalogue of 29 conditions
  across seven crops (Apple, Corn, Grape, Pepper, Potato, Strawberry, Tomato),
  with severity, symptoms, causes, organic remedies, chemical treatment,
  prevention and precautions.
- **Disease details** — the full remedy plan for a single condition.
- **About page** covering the architecture and the technology used.
- Light/dark theme with no flash of the wrong theme on first paint.

### Authenticated users

- **Detection** — drag-and-drop image upload with client-side validation,
  upload progress and an immediate result view.
- **Result page** — the diagnosis, a confidence meter, the runner-up classes,
  the matched remedy plan and the model disclaimer.
- **Prediction history** — every scan with search, plant and status filters,
  pagination and deletion.
- **Dashboard** — total scans, outcomes, a 7-day activity chart and the most
  detected conditions.
- **Profile** — name/phone/location/avatar, email change, password change and
  permanent account deletion.

### Administrators

- **Overview** — system counters, outcome and severity breakdowns, most detected
  diseases, latest predictions and live AI service status.
- **User management** — search, role changes, activation/deactivation, creation
  and deletion. Self-demotion, self-deactivation and self-deletion are blocked.
- **Disease management** — create, edit, hide and delete knowledge-base records,
  including the mapping to the ML class label.
- **Prediction oversight** — every prediction across all users, filterable, with
  deletion.

### Safety and honesty

- Predictions are stored with `predictionSource` (`ml`, `mock` or `manual`), and
  the UI badges demo results as **"Demo (mock) result"**. A fallback prediction
  is never presented as a real diagnosis.
- Every result carries a disclaimer advising confirmation by an agriculture
  expert.
- Below 70 % confidence the result page asks for a clearer image instead of
  showing a confident answer.
- Rate limiting on login, registration and prediction endpoints, plus an
  in-flight guard that prevents a second concurrent prediction per user.
- Helmet security headers, bcrypt password hashing and JWT with role checks.

---

## How the prediction pipeline works

```
   leaf.jpg
      │
      ▼
   React (ImageUploader)          validates type + size, previews the image
      │  multipart/form-data  (field name: "image")
      ▼
   Express  POST /api/predictions  rate limit → single-flight guard → multer
      │                              → magic-byte check → Cloudinary or local disk
      ▼
   Python  POST :8000/predict      FastAPI + Pillow → 224×224 RGB, raw 0–255
      │
      ▼
   predictor.py                    loads models/plant_disease_cnn.keras
      │                            (lazy, on the first request)
      │  source: "ml"              real Keras inference
      │  source: "mock"            deterministic fallback, no model file
      ▼
   Node resolves the disease       Disease.mlLabels ⇄ model class name
      │
      ▼
   MongoDB                         one Prediction document per image
      │
      ▼
   Result payload                  { prediction, disease, remedyNotice,
                                     lowConfidenceWarning, disclaimer }
```

Two endpoints exist on purpose:

- `POST /api/predictions` — analyse **and** save to history. Used by the UI.
- `POST /api/predict` — analyse only, nothing is stored. Available for API demos.

The saved record keeps its own copy of `plantName`, `diseaseName` and
`confidence`, so deleting a disease from the knowledge base never breaks a
user's history.

---

## Technology

**Frontend** — React 18, Vite 6, React Router 6, Tailwind CSS 3, Axios,
React Toastify, Lucide icons, react-chartjs-2.

**Backend** — Node.js, Express 4, Mongoose 8, jsonwebtoken, bcryptjs, multer,
helmet, cors, express-rate-limit, Cloudinary (optional), morgan.

**ML service** — Python 3.9–3.12, FastAPI, Uvicorn, TensorFlow / Keras,
Pillow, scikit-learn (evaluation), NumPy.

**Data** — MongoDB (local `mongod` or MongoDB Atlas).

---

## Prerequisites

| Requirement | Version | Notes |
| --- | --- | --- |
| Node.js | 18 or newer | Developed on 24.x |
| npm | 9 or newer | Ships with Node |
| MongoDB | 6 or newer | Local service or Atlas cluster |
| Python | **3.9 – 3.12** | 3.13 has no TensorFlow wheel yet |

> **Important:** TensorFlow does not publish wheels for Python 3.13. If
> `pip install -r requirements.txt` fails, install Python 3.11 and create the
> virtual environment with it.

---

## Project structure

```
.
├── backend/                  Express API
│   ├── config/               environment parsing and validation
│   ├── controllers/          auth, users, diseases, predictions, admin
│   ├── data/                 disease catalogue seed source
│   ├── middleware/           auth, admin guard, upload, error handling
│   ├── models/               User, Disease, Prediction
│   ├── routes/               auth, user, disease, prediction, admin
│   ├── services/             mlService, cloudinaryService, diseaseMatchService
│   ├── utils/                helpers, validators, in-flight guard
│   ├── tests/                api.test.js, integration.test.js
│   ├── seed.js               idempotent demo data
│   └── server.js             entry point
│
├── frontend/                 React SPA
│   └── src/
│       ├── components/       shared UI (Navbar, Footer, Modal, cards, …)
│       ├── context/          AuthContext, ThemeContext
│       ├── hooks/            useAsyncData, useDebounce
│       ├── layouts/          PublicLayout, DashboardLayout
│       ├── pages/            public pages, user pages, admin/ pages
│       ├── services/         api.js (Axios), index.js (endpoints)
│       ├── utils/            constants, formatters, imageValidation
│       ├── App.jsx           routes
│       ├── index.css         design system
│       └── main.jsx          providers
│
├── ml-service/               FastAPI inference + training
│   ├── app.py                FastAPI application
│   ├── predictor.py          model loading, inference, mock classifier
│   ├── preprocessing.py      image → tensor pipeline
│   ├── classes.py            the 29 class labels
│   ├── train.py              training and evaluation
│   ├── prepare_dataset.py    dataset/ validation and train/validation split
│   ├── test_app.py           endpoint tests
│   ├── models/               trained model + labels.json (git-ignored)
│   ├── data/                 class → disease mapping data
│   └── dataset/              prepared dataset (git-ignored)
│
└── docs/
    └── screenshots/          screenshot plan (images not committed yet)
```

---

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

- `MONGO_URI` — `mongodb://127.0.0.1:27017/plant_disease` for a local server, or
  your Atlas connection string.
- `JWT_SECRET` — generate one:

  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

- `CLIENT_URL` — `http://localhost:5173`.
- Cloudinary keys are optional. Leave them blank to store uploads in
  `backend/uploads/` instead.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

`VITE_API_URL=/` uses the Vite dev proxy, so no CORS configuration is needed
during development.

### 3. ML service

```bash
cd ml-service
python -m venv .venv
.\.venv\Scripts\activate        # Windows
# source .venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
cp .env.example .env
```

The service starts **without** a trained model. In that mode `/predict` returns a
deterministic mock classification and every result is labelled
`source: "mock"`, so the whole application stays demo-able while
[training](#training-the-model) the real model.

### 4. Seed the database

```bash
cd backend
npm run seed
```

This is idempotent — safe to run again. It creates the administrator account,
the 29 disease records and a few example predictions so every screen has data.
Use `npm run seed:fresh` to wipe and recreate.

---

## Running the application

Open three terminals:

```bash
# 1) ML service
cd ml-service
.\.venv\Scripts\activate
python app.py                  # http://127.0.0.1:8000

# 2) Backend
cd backend
npm run dev                    # http://localhost:5000

# 3) Frontend
cd frontend
npm run dev                    # http://localhost:5173
```

Then open **http://localhost:5173**.

Useful endpoints:

- http://localhost:5173 — application
- http://localhost:5000/api/health — API health and storage status
- http://localhost:8000/health — ML service health (model loaded or mock)

To serve the production build:

```bash
cd frontend
npm run build
npm run preview
```

---

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@plantdisease.com` | `Admin@123` |
| User | `ravi@example.com` | `User@123` |
| User | `priya@example.com` | `User@123` |
| User | `amit@example.com` | `User@123` |

The administrator panel is at `/admin`; `/admin/login` has its own sign-in screen.
Change the seeded passwords before using this anywhere public.

---

## Training the model

### Prepare the dataset

Place the PlantVillage dataset in a folder with one directory per class, then:

```bash
cd ml-service
python prepare_dataset.py --source "C:/datasets/PlantVillage"
```

This validates the folder layout and creates a reproducible 80/20
`dataset/train` + `dataset/validation` split.

### Train

```bash
# Small CNN trained from scratch -- runs on modest hardware
python train.py

# Quick smoke test
python train.py --epochs 5

# Transfer learning with a pretrained backbone (frozen, head only)
python train.py --model efficientnet
python train.py --model resnet50

# Fine-tune the whole network
python train.py --model efficientnet --unfreeze-backbone
```

Training writes:

- `models/plant_disease_cnn.keras` — the model
- `models/labels.json` — the class list in index order
- `models/checkpoints/best.weights.h5` — best weights
- `models/training_history.png` — accuracy/loss curves (needs `matplotlib`)

`app.py` picks the model up automatically on the next request, and `/health`
flips `model_loaded` to `true`.

> **Normalisation is part of the saved graph.** The custom CNN contains an
> explicit `Rescaling(1/255)`; `EfficientNetV2B0` rescales internally; for
> `ResNet50`, which ships no normalisation layer, ImageNet standardisation is
> added during training. Training and inference therefore both feed raw 0–255
> pixels and cannot drift apart.

---

## Testing

Start the MongoDB, the backend and the ML service first — the integration and ML
suites talk to running processes.

```bash
# Backend API suite (68 checks)
cd backend
npm test

# Live Node -> Python -> MongoDB integration (7 checks)
npm run test:integration

# ML service endpoints (27 checks)
cd ml-service
.\.venv\Scripts\activate
python test_app.py
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

The integration suite reads `/health` from the Python service and asserts the
prediction source accordingly: it expects `"ml"` when a trained model is
present and `"mock"` when the service falls back, so it never passes by
pretending a demo result is a real diagnosis.

---

## API reference

All responses use the envelope `{ success, message, data, pagination }`. Errors
return `{ success: false, message, errors: [{ field, message }] }`.

### Auth

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | public | Create an account and sign in |
| `POST` | `/api/auth/login` | public | Sign in |
| `POST` | `/api/auth/logout` | public | Sign out |
| `GET` | `/api/auth/me` | user | Current user |
| `POST` | `/api/auth/verify-token` | user | Token check |

### Users

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/users/profile` | user | Profile + counters |
| `PUT` | `/api/users/profile` | user | Update name, phone, location, avatar |
| `PUT` | `/api/users/password` | user | Change password |
| `PUT` | `/api/users/email` | user | Change email |
| `DELETE` | `/api/users/profile` | user | Delete account |

### Diseases

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/diseases` | public | List (`search`, `plant`, `severity`, `sort`, `page`, `limit`) |
| `GET` | `/api/diseases/plants` | public | Distinct plants and severities |
| `GET` | `/api/diseases/:id` | public | Single record |
| `POST` | `/api/diseases` | admin | Create |
| `PUT` | `/api/diseases/:id` | admin | Update |
| `DELETE` | `/api/diseases/:id` | admin | Delete |

### Predictions

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/predictions` | user | Analyse and save (`multipart`, field `image`) |
| `POST` | `/api/predict` | user | Analyse only |
| `GET` | `/api/predictions/my` | user | History (`search`, `plant`, `status`, `page`) |
| `GET` | `/api/predictions/stats/my` | user | Dashboard aggregate |
| `GET` | `/api/predictions/:id` | owner/admin | Single record |
| `DELETE` | `/api/predictions/:id` | owner/admin | Delete record and image |

### Admin

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/statistics` | Dashboard counters and charts |
| `GET` | `/api/admin/ml-health` | ML service liveness |
| `GET` | `/api/admin/users` | List users (`search`, `role`, `page`) |
| `POST` | `/api/admin/users` | Create a user |
| `PUT` | `/api/admin/users/:id` | Change role / activation |
| `DELETE` | `/api/admin/users/:id` | Delete user and their predictions |
| `GET` | `/api/admin/predictions` | All predictions (`search`, `status`, `plant`) |
| `DELETE` | `/api/admin/predictions/:id` | Delete a prediction |

### ML service

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Service info |
| `GET` | `/health` | Status, `model_loaded`, `model_loadable`, `tensorflow_installed`, class count, latency |
| `GET` | `/classes` | Class list in index order |
| `POST` | `/predict` | Classify an uploaded image |

`/health` separates three different facts so nothing is over-reported:

| Field | Meaning |
| --- | --- |
| `model_available` | A model file exists on disk |
| `tensorflow_installed` | TensorFlow is importable in this Python environment |
| `model_loaded` | Both of the above, i.e. real inference can actually run |

---

## Configuration

### `backend/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | API port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/plant_disease` | Database |
| `JWT_SECRET` | — | **Change this** |
| `NODE_ENV` | `development` | Environment |
| `CLIENT_URL` | `http://localhost:5173` | CORS origins (comma separated) |
| `CLOUDINARY_*` | blank | Blank ⇒ local disk storage |
| `ML_SERVICE_URL` | `http://127.0.0.1:8000` | Python service |
| `ML_TIMEOUT_MS` | `45000` | Inference timeout |
| `ALLOW_MOCK_PREDICTION` | `true` | Mock fallback; `false` in production |
| `SEED_ADMIN_*` | see `.env.example` | Seeded admin account |

### `ml-service/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `ML_PORT` | `8000` | Service port |
| `MODEL_PATH` | `models/plant_disease_cnn.keras` | Trained model |
| `ML_ALLOW_MOCK` | `true` | `false` ⇒ HTTP 503 instead of a fallback |
| `ML_MAX_FILE_SIZE_MB` | `8` | Upload limit |

### `frontend/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `/` | `/` uses the dev proxy, or an absolute API URL |
| `VITE_APP_NAME` | `Plant Disease Detection` | Display name |

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'tensorflow'`**
Python 3.13 is not supported by TensorFlow. Install Python 3.11 and recreate the
virtual environment.

**Results say "Demo (mock) result"**
Expected until a model has been trained. Check http://localhost:8000/health:
`model_loaded: false` means real inference cannot run. Look at
`model_available` (is the file there?) and `tensorflow_installed` (can Python
even load it?) to see which half is missing. Train with `python train.py`, or set
`MODEL_PATH` to an absolute path.

**`MongooseServerSelectionError`**
MongoDB is not running or `MONGO_URI` is wrong. Verify with
`mongosh` or check the Atlas network access list.

**Frontend shows "Cannot reach the server"**
The backend is not running on port 5000. Confirm with
`http://localhost:5000/api/health`.

**CORS error in the console**
Either use the Vite proxy (`VITE_API_URL=/`) or add the frontend origin to
`CLIENT_URL` in `backend/.env`.

**Port already in use**
Change `PORT`/`ML_PORT`, or pass `--port` to `npm run dev`.

**403 from an admin endpoint**
The signed-in account has the `user` role. Sign in with the administrator
account at `/admin/login`.

---

## Disclaimer

Predictions are produced by a machine learning model and are an aid for decision
making only. Always confirm with a local agriculture expert or extension officer
before applying any treatment or pesticide, and follow the product label.