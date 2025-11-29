# yield · AI Memory Assistant

Full-stack second brain that unifies chat, memories, file-based RAG, and smart reminders. The **frontend** (Next.js 14 + Tailwind + Redux) talks to the **FastAPI** backend which streams Grok-3 responses, manages user-scoped Supabase data, and runs background schedulers.

---

## ✨ Product Highlights

- **Auth-guarded dashboard** with persistent chat history, memory bank, smart inbox, file uploads, and profile settings.
- **Streaming AI assistant** that automatically searches or mutates memories through LangChain tools.
- **Memory Processor** daemon that sanitizes/extracts long-term facts before writing to Supabase.
- **File uploads ➜ RAG** using Gemini embeddings, RecursiveCharacterTextSplitter, and Supabase Storage/vector search.
- **Smart Inbox reminders** powered by APScheduler + notifications API.
- **Responsive landing page** at `/` showcasing the product with framer-motion micro-interactions.

---

## 🧱 Tech Stack

| Layer        | Technologies                                                                 |
| ------------ | ----------------------------------------------------------------------------- |
| Frontend     | Next.js 14 (App Router), React 19, Tailwind, framer-motion, Redux Toolkit     |
| Backend      | FastAPI, LangChain, xAI Grok-3, Supabase client, APScheduler                  |
| AI / Memory  | Google Generative AI embeddings, Supabase vector store, custom memory tools   |
| Storage      | Supabase Postgres + Storage buckets                                           |

---

## 📂 Repository Layout

```
.
├─ backend/        # FastAPI service
│  ├─ src/
│  └─ tests/
└─ frontend/       # Next.js application
   ├─ app/
   ├─ components/
   └─ lib/
```

Each subdirectory ships with its own README plus package manager (pip / npm).

---

## 🚀 Getting Started

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# create backend/.env and add your Supabase/xAI/Google keys
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
# create frontend/.env.local with NEXT_PUBLIC_SUPABASE_* vars
npm run dev
```

Visit:
- Landing page: http://localhost:3000/
- Dashboard (auth required): http://localhost:3000/chat
- API docs: http://localhost:8000/docs

---

## 🧪 Testing & Quality

- **Backend smoke tests** live under `backend/tests` (`pytest`).
- **Manual verification**: streaming chat, memory add/delete, file ingestion notifications, smart inbox badge, responsive layout.
- **Structured logging**: `LOG_LEVEL` controls the new logging pipeline; every critical service logs via `yield.*` namespaces.
- **CI-ready**: add your preferred GitHub Action calling `pytest` + `npm run lint` to ship this to recruiters/teams.

---

## 🛠 Helpful Scripts

| Command                    | Description                               |
| -------------------------- | ----------------------------------------- |
| `uvicorn main:app --reload`| Backend dev server                        |
| `npm run dev`              | Frontend dev server                       |
| `pytest`                   | Backend smoke tests                       |
| `npm run lint`             | Next.js linting (if configured)           |

---

## 🔍 Observability

- Central logging config (`backend/src/core/logging.py`) emits consistent console output.
- Scheduler, file ingestion, memory processor, and AI service all log structured events.
- Health endpoint (`/health`) is test-covered and safe to expose for uptime monitors.

---

## 📌 Portfolio Notes

What’s production-ready:
- Full auth pipeline (Supabase JWT) and user-scoped data access.
- Background sanitization and proactive memory retrieval for better AI answers.
- File-based RAG integration with chunked embeddings.
- Modern landing page plus responsive dashboard pages.

What to mention as next steps:
- Broader automated test coverage (service-layer and frontend component tests).
- Rate limiting & telemetry/export to a log drain.
- Additional CI automation (lint + type checks).

This repo now tells a complete story for advanced product engineering work—feel free to reference it directly in your portfolio or attach screenshots/video walkthroughs for extra context.

---

Built by Jesse’s “yield” initiative • 2025

