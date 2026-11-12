# How to Run — RC Cinemas

FastAPI backend + React (Vite + TypeScript + Tailwind) frontend. Run the
backend first, then the frontend.

## Backend

### Prerequisites
- Python 3.11+ (tested on 3.12)

### Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### (Optional) Configure environment variables
All variables are optional — sane local-dev defaults are baked into
`app/config.py`. Copy `.env.example` to `.env` to override:
```
APP_DATABASE_URL=sqlite:///./rc_cinemas.db
APP_JWT_SECRET=dev-only-secret-change-me-in-production
APP_ACCESS_TOKEN_EXPIRE_MINUTES=720
APP_CORS_ORIGINS=http://localhost:5174,http://127.0.0.1:5174
```

### Run
**Important:** the frontend's dev proxy defaults to port **8010**, not the
usual 8000:
```bash
uvicorn app.main:app --reload --port 8010
```

- API: http://127.0.0.1:8010
- Interactive docs: http://127.0.0.1:8010/docs
- SQLite DB: `backend/rc_cinemas.db` (auto-created)

## Frontend

### Prerequisites
- Node.js 18+

### Setup
```bash
cd frontend
npm install
```

### Run
```bash
npm run dev
```

Opens at http://127.0.0.1:5174 (fixed in `vite.config.ts`). API calls to
`/api/*` are proxied to `http://127.0.0.1:8010` by default — make sure the
backend was started with `--port 8010`. Override the proxy target with
`VITE_API_PROXY_TARGET` if needed.

### Production build (optional)
```bash
npm run build      # tsc -b && vite build, outputs to frontend/dist/
npm run preview     # serve the production build locally
```
