# Unified Monorepo

This repository combines two separate projects into a cohesive full‑stack layout:

- **Client**: `apps/client` (from `1stplace-main`)
- **Server**: `apps/server` (from `veri-flow-forge-50106-22089-main`)

## Detected tech (auto-scanned)
### Client
- Detected: No Node
- TS config: no
- Python reqs: none
- FastAPI: yes
- Flask: no
- Django: no

### Server
- Detected: Node
- TS config: yes
- Python reqs: none
- FastAPI: no
- Flask: no
- Django: no
- package.json name: vite_react_shadcn_ts
- scripts: build, build:dev, dev, lint, preview

## Getting Started (Node workspaces)
```bash
# in repo root
npm install
npm run dev
# or run individually
npm run dev:client
npm run dev:server
```

> If your backend is Python (FastAPI/Flask/Django), use the provided structure but start it via its own instructions in `apps/server/` (e.g., `uvicorn main:app --reload`).

## Docker (optional)
A generic `docker-compose.yml` is included. Adjust Dockerfiles/commands in `apps/client` and `apps/server` to fit your frameworks.
