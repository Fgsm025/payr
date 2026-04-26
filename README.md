# Payr

Accounts payable MVP: React + Vite frontend, NestJS + Prisma + SQLite backend.

## AI Bill Extraction

The application includes an automated bill extraction feature powered by OpenAI (gpt-4o-mini).

**Real Mode:** To test with real documents, add your `OPENAI_API_KEY` to the `.env` file in the backend (see `backend/.env`).

**Simulation Mode:** If no API key is provided, the system will automatically fall back to a simulation mode. This allows you to experience the UI/UX flow (loading states, auto-filling, and validation) without needing an external account.

**PDF vs images:** OpenAI’s vision input accepts image MIME types only. For PDFs, the backend extracts embedded text and sends that to the model. Scanned PDFs with no text layer should be uploaded as **PNG or JPEG** (or use OCR elsewhere first).
