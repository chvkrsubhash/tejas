# API & Database Documentation

## REST Endpoints
- `GET /api/health` — Service health & brand metadata
- `POST /api/auth/register` — Register user (bcrypt password hashing, returns JWT)
- `POST /api/auth/login` — Authenticate user (returns JWT)
- `GET /api/presentations` — List presentations owned by or shared with current user
- `POST /api/presentations` — Create presentation
- `GET /api/presentations/{id}` — Fetch presentation (enforces owner/editor/commenter/viewer)
- `PUT /api/presentations/{id}` — Update presentation (enforces owner/editor)
- `DELETE /api/presentations/{id}` — Delete presentation (owner only)
- `POST /api/presentations/{id}/permissions` — Share with user email & role
- `POST /api/presentations/{id}/comments` — Add slide/object comment
- `POST /api/presentations/import/pptx` — Server-side `python-pptx` import with zip safety checks
- `POST /api/ai/chat` — Provider-independent AI completion (Gemini, Groq, OpenRouter, Ollama)
- `POST /api/ecosystem/import-to-slides` — Import Titan document or Europa notebook markdown into slides
- `WS /ws/collab/{presentation_id}` — Binary WebSocket room for Yjs CRDT updates

## MongoDB Collections
`users`, `presentations`, `slides`, `slide_objects`, `slide_masters`, `themes`, `templates`, `animations`, `transitions`, `media_assets`, `presentation_permissions`, `comments`, `revisions`, `folders`, `ai_conversations`, `ai_messages`, `user_preferences`, `audit_logs`.

