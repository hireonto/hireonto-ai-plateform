# Deploy HireOnto backend + database + AI to Railway

Five things run on Railway, all from this one GitHub repo:

| Railway service | What | Source | Config file | Public URL |
|---|---|---|---|---|
| **Postgres** (pgvector) | Database | Railway template | — | no |
| **Redis** | Job queues, realtime | Railway template | — | no |
| **backend** | NestJS API + Prisma | repo root `/` | `/railway.json` | **yes** → `api.your-domain.com` |
| **ai-api** | FastAPI (scoring, chat interview, evaluation) | `/ai` | `/ai/railway.api.json` | no (backend calls it privately) |
| **ai-agent** | Tovia voice worker (LiveKit) | `/ai` | `/ai/railway.agent.json` | no |

The website and portal go to Vercel (see their READMEs). Voice runs through **LiveKit Cloud**; files go to an **S3-compatible bucket** (Railway Buckets, Cloudflare R2 or AWS S3); email goes through any **SMTP** provider (e.g. Resend).

---

## 1. Push the repo to GitHub
Push the whole `hireonto/` folder (private repo). `.gitignore` keeps every `.env`, `node_modules`, `dist`, `.next`, `ai/.venv`, `logs` and `design-assets/` out.

## 2. Create the Railway project
1. New Project → **Deploy PostgreSQL** — choose the **pgvector** template (the schema needs the `vector` extension).
2. **+ New → Database → Redis**.

## 3. backend service
**+ New → GitHub Repo →** this repo.
- Settings → **Root Directory:** `/`  · **Config file path:** `/railway.json`
- Settings → Networking → **Generate Domain** (or add `api.your-domain.com`).

Every deploy runs `npm run railway:predeploy` first: `prisma migrate deploy` + the first-admin bootstrap. Health check: `/health`.

**Variables** (copy the rest from your local `.env`):

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_INTERNAL_SECRET` | **new** values: `openssl rand -base64 48` each |
| `APP_URL` | portal URL, e.g. `https://app.your-domain.com` |
| `BACKEND_PUBLIC_URL` | `https://api.your-domain.com` |
| `CORS_ORIGINS` | `https://app.your-domain.com,https://your-domain.com` |
| `AI_SERVICE_URL` | `http://${{ai-api.RAILWAY_PRIVATE_DOMAIN}}:8000` |
| `AI_FAKE_MODE` | `false` |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | from LiveKit Cloud |
| `LIVEKIT_AGENT_NAME` | must equal `AGENT_NAME` on the AI services |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION` | your bucket |
| `EMAIL_PROVIDER`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | your SMTP provider |
| `BOOTSTRAP_COMPANY_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | first admin (password ≥ 12 chars) |
| Google / Microsoft / Twilio keys | optional; set OAuth redirect URIs to `https://api.your-domain.com/integrations/.../callback` |

After the first successful deploy, log in, change the admin password, and **delete `BOOTSTRAP_ADMIN_PASSWORD`** from the variables.

## 4. ai-api service
**+ New → GitHub Repo →** same repo.
- **Root Directory:** `/ai` · **Config file path:** `/ai/railway.api.json`
- No public domain needed.

**Variables:** everything from `ai/.env`, plus:

| Variable | Value |
|---|---|
| `PORT` | `8000` |
| `BACKEND_URL` | `http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:3001` |
| `JWT_INTERNAL_SECRET` | same as the backend |
| `LIVEKIT_*`, `AGENT_NAME` | same values as the backend |
| `S3_*` | same bucket as the backend |

## 5. ai-agent service (Tovia)
**+ New → GitHub Repo →** same repo.
- **Root Directory:** `/ai` · **Config file path:** `/ai/railway.agent.json` (start command `python -m agent.worker start`)
- Variables: same as **ai-api** (tip: use Railway "shared variables" for both).
- No domain, no port. It connects out to LiveKit Cloud.

## 6. Outside services
- **LiveKit Cloud:** create a project; pick the region closest to your candidates.
- **Bucket:** allow CORS `PUT, GET` from the portal domain (uploads go straight from the browser).
- **SMTP:** verify your sending domain (SPF/DKIM), otherwise invites land in spam.

## 7. Connect the frontends
- Portal (Vercel): `VITE_API_URL` and `VITE_SOCKET_URL` = `https://api.your-domain.com`.
- Website (Vercel): `NEXT_PUBLIC_APP_URL` = portal URL.

## 8. Check after deploy
- [ ] `https://api.your-domain.com/health` → `{"status":"ok"}`
- [ ] backend deploy logs show `prisma migrate deploy` + `[bootstrap] Created admin ...`
- [ ] Log in to the portal with the bootstrap admin
- [ ] Create a job, upload a resume → fit score appears (ai-api works)
- [ ] Send an invite → email arrives with a working portal link
- [ ] Open the invite → voice interview with Tovia connects (ai-agent + LiveKit work)
- [ ] Evaluation report appears after the interview

## Region and cost
Put Railway services, LiveKit and the database in the region closest to your candidates (voice latency). Expect roughly $15–40/month on Railway for these five services at low traffic; LLM, speech and LiveKit usage is billed by those providers.
