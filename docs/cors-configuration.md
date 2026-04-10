# CORS (API ↔ frontend)

The NestJS API in `backend/` enables CORS for browser clients. The browser sends the `Origin` header; the API must echo it with `Access-Control-Allow-Origin` for that origin to be allowed.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `CORS_ORIGIN` | Primary list of allowed origins (comma-separated). |
| `CORS_INTERNAL_ORIGIN` | Optional; backoffice / internal app URLs (comma-separated). |
| `CORS_PORTAL_ORIGIN` | Optional; customer portal URLs (comma-separated). |

All non-empty values are merged and de-duplicated. If **all** are unset, the API allows `http://localhost:8080` only (local dev).

## Fixing “No Access-Control-Allow-Origin” in production

1. Set `CORS_ORIGIN` on the **API** service to the exact frontend origin, including scheme and host, **no trailing slash** — e.g. `https://hydra.humansoftware.mx`.
2. Redeploy the API after changing env vars.
3. If you use split origins (`CORS_INTERNAL_ORIGIN` / `CORS_PORTAL_ORIGIN`), you can still set `CORS_ORIGIN` as well; all lists are merged.

Implementation: `backend/src/main.ts`.
