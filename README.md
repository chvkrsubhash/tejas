# Tejas — Presentation Editor by AkashaVyom Labs

**Tejas** is a browser-based, desktop-first presentation creation and editing application developed for **AkashaVyom Labs**. The product name is configurable via `VITE_PRODUCT_NAME` / `PRODUCT_NAME`.

## Architecture

- **Frontend (`frontend/`)**: React 19, TypeScript, Vite, Tailwind CSS v4, Konva, Tiptap, Radix UI, Lucide Icons, Zustand, PptxGenJS, jsPDF, JSZip, IndexedDB (`idb`), and Yjs.
- **Backend (`backend/`)**: Python FastAPI, Motor (MongoDB Atlas async driver), JWT auth (`python-jose`, `passlib[bcrypt]`), `python-pptx`, WebSocket collaboration rooms, and a provider-independent AI service (Gemini, Groq, OpenRouter, Ollama).

## Installation & Local Development

### Frontend
```bash
cd frontend
cp .env.example .env
npm install --legacy-peer-deps
npm run dev
```

Run frontend tests and production build:
```bash
npm test
npm run build
```

### Backend
```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Deployment
- **Frontend**: Deploy `frontend/dist` to Cloudflare Pages, Netlify, or Vercel.
- **Backend**: Deploy `backend/` to Render, Railway, or Fly.io with MongoDB Atlas free-tier cluster.

