# TimeTracker Frontend

Next.js (App Router) + TypeScript frontend for the TimeTracker backend.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

For a production build: `pnpm build && pnpm start`.

## Backend API

All API calls go through `app/lib/api.ts`:

- `API_BASE` — base URL for all requests. Defaults to `https://localhost/api` (the nginx proxy in `docker-compose.yaml` strips the `/api` prefix before forwarding to the backend).
- Override it with the `NEXT_PUBLIC_API_BASE` env var, e.g. `NEXT_PUBLIC_API_BASE=http://localhost:8010` when running the backend directly without nginx.

`apiFetch(path, init)` wraps `fetch`: it parses the JSON body and throws on non-2xx responses **and** on the backend's 200-with-`{ "error": ... }` responses (which the backend returns for e.g. deleting a missing project).
