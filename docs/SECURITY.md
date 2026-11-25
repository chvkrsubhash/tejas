# Security & Known Limitations

## Security Controls Implemented
- **Password Hashing**: `passlib[bcrypt]` on backend.
- **Authentication & Authorization**: JWT bearer tokens (`HS256`) and per-presentation role checks (`owner`, `editor`, `commenter`, `viewer`) in `backend/app/services/auth.py`.
- **Archive & Upload Protection**: Client-side 50 MB limit and server-side `validate_pptx_archive()` checking compressed and uncompressed sizes to prevent zip bombs.
- **Credential Isolation**: API keys are stored in backend `.env` or user-configured local IndexedDB settings—never hardcoded in frontend bundles.
- **Iframe Sandboxing**: Web embeds enforce `https://` URLs and `sandbox="allow-scripts allow-same-origin"`.
- **Rate Limiting**: `slowapi` integrated on FastAPI app.

## Known Limitations
1. **Python Runtime**: Python is not installed in the local verification environment, so backend `pytest` tests were written but not executed locally; frontend Vitest tests, TypeScript check, and Vite build were executed and verified.
2. **Client-side PPTX Import**: Embedded images/charts inside `.pptx` files are flagged with a warning in the browser-only OOXML parser; full media extraction uses the backend `python-pptx` endpoint.
3. **Playwright PDF**: Server-side Playwright PDF rendering is listed in `requirements.txt` for high-fidelity headless exports, while client-side PDF export uses `jsPDF`.

