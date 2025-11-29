# yield AI Memory Assistant · Backend

FastAPI service that powers the **yield** second-brain experience. It streams Grok-3 responses, manages long‑term memories in Supabase, ingests uploaded files into a vector store, and runs scheduled reminder jobs.

---

## ✅ Feature Highlights

- **Secure per-user access** with Supabase JWT validation.
- **Streaming `/api/chat` endpoint** with tool-aware Grok-3 agent.
- **Memory Processor** background task that sanitizes/saves/deletes facts.
- **File ingestion RAG pipeline** (TXT/MD/PDF/CSV/XLS/XLSX ➜ Gemini embeddings ➜ Supabase).
- **Smart Inbox scheduler** using APScheduler for reminders & notifications.
- **Structured logging** + health checks + smoke tests (`pytest`).

---

## 🗂️ Project Layout

```
backend/
├─ main.py               # FastAPI entrypoint & router wiring
├─ requirements.txt
├─ src/
│  ├─ api/routes/        # Chat, memories, notifications, files
│  ├─ core/
│  │   ├─ config.py      # Pydantic settings
│  │   └─ logging.py     # Central logging config
│  ├─ db/client.py       # Supabase client factory
│  └─ services/          # AI, tools, memory processor, scheduler, ingestion
└─ tests/
   └─ test_routes.py     # Public route smoke tests
```

---

## ⚙️ Requirements

- Python 3.12+
- Supabase project (URL, `service_role` key, JWT secret)
- xAI Grok key
- Google Generative AI key (text-embedding-004)

Create `backend/.env` (or export vars) with:

```
XAI_API_KEY=...
GOOGLE_API_KEY=...
SUPABASE_URL=...
SUPABASE_KEY=...          # service role for RLS-protected tables
SUPABASE_JWT_SECRET=...
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=INFO
```

---

## 🧪 Setup & Testing

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Run API (reload ready)
uvicorn main:app --reload --port 8000

# Run smoke tests
pytest
```

The tests stub the required env variables and ensure `/` plus `/health` stay public/healthy—use them as a template for deeper coverage.

---

## 📡 Key Endpoints

| Method | Path              | Notes                                           |
| ------ | ----------------- | ----------------------------------------------- |
| GET    | `/health`         | Liveness probe                                  |
| GET    | `/`               | Public metadata                                 |
| POST   | `/api/chat`       | Authenticated streaming chat (JWT required)     |
| GET    | `/api/memories`   | List/search user memories                       |
| POST   | `/api/memories`   | Manual memory insert                            |
| POST   | `/api/files/upload` | Authenticated file ➜ RAG ingestion           |
| GET/DELETE | `/api/notifications` | Smart inbox APIs                         |

All `/api/**` routes require the Supabase JWT supplied by the frontend.

---

## 🔐 Authentication Flow

1. Frontend obtains Supabase session/token.
2. Token is sent in `Authorization: Bearer <jwt>`.
3. `src/api/deps.get_current_user` verifies signature via `SUPABASE_JWT_SECRET` and injects `user_id`.
4. Every DB call (memories, files, notifications) scopes by `user_id`.

---

## 🧠 Memory & RAG Stack

- `services/ai_service.py`: Runs Grok-3 with bound tools (`search_memory`, `delete_memory`, `schedule_reminder`). Proactively injects recent memories.
- `services/memory_processor.py`: Background extractor that converts raw chat into third-person facts and sanitizes deletes.
- `services/tools.py`: All Supabase memory mutations (add/search/delete/reminders) with structured logging.
- `services/file_ingestion.py`: Uploads to Supabase Storage, extracts text, chunks w/ LangChain splitters, embeds via Gemini, and stores chunks.

---

## ⏱ Background Scheduler

`services/scheduler_service.py` runs every 60s via APScheduler. It picks up due reminders, creates notifications, and flips their status. Logging is centralized, so reminders show up in stdout/Log drains cleanly.

---

## 🪵 Observability

- `src/core/logging.py` wires JSON-friendly console logging.
- Log level controlled by `LOG_LEVEL`.
- All critical services (AI, memory processor, file ingestion, scheduler) now emit structured messages. Replace `print` statements with `logger.*` when extending the codebase.

---

## 🧭 Extending the API

1. Add modules under `src/api/routes/`.
2. Import routers in `main.py` and register with `app.include_router`.
3. For new background workflows, create a dedicated service file and register jobs inside `scheduler_service`.
4. Keep secrets out of code—extend `Settings` with new `Field(..., validation_alias="NEW_ENV")` entries.

---

## 🙋 Troubleshooting

- **`401 Unauthorized`**: Ensure the frontend forwards the Supabase JWT and that `SUPABASE_JWT_SECRET` matches your project.
- **`Failed to upload file`**: Confirm the `memory-files` bucket exists in Supabase Storage and the service key has access.
- **Embedding or Grok errors**: Double-check Google/xAI keys and that the models are enabled for your org.
- **Scheduler noise in tests**: Use `ENABLE_SCHEDULER=false` (future enhancement) or keep tests limited to public routes as shown.

---

Built with ❤️ on FastAPI, LangChain, Grok-3, Supabase, and Gemini embeddings.

