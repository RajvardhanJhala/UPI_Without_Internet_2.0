# Deploying UPI Offline Mesh

The app is split into two independently deployed pieces:

| Piece | Lives in | Hosted on | Why |
|---|---|---|---|
| **Backend** (Spring Boot API) | repo root (`src/`, `Dockerfile`) | **Render** (free web service) | Vercel can't run a long-lived JVM process; Render runs the Docker image. |
| **Frontend** (React + Vite SPA) | `web/` | **Vercel** | Static SPA on Vercel's edge; talks to the Render API over HTTPS. |

Deploy the **backend first** — you need its URL to configure the frontend.

---

## 0. Prerequisite — push to GitHub

Both Render and Vercel deploy from a GitHub repo (and redeploy on every push to
`main`). If this isn't on GitHub yet:

```bash
gh repo create upi-offline-mesh --public --source=. --remote=origin --push
# or, with an existing empty repo:
git remote add origin https://github.com/<you>/upi-offline-mesh.git
git push -u origin main
```

---

## 1. Backend → Render

**Option A — Blueprint (recommended):** the repo already has [`render.yaml`](render.yaml).

1. Render dashboard → **New → Blueprint** → connect the repo. Render reads
   `render.yaml`, sees the Dockerfile, and provisions a free web service.
2. It deploys and gives you a URL like `https://upi-offline-mesh-api.onrender.com`.
   Copy it — you'll need it in step 2.

**Option B — manual:** New → Web Service → connect repo → Runtime **Docker** →
Instance type **Free** → add env var `SPRING_PROFILES_ACTIVE=prod` → Create.

Verify: open `https://<your-render-url>/api/stats` — you should get
`{"total":0,"outcomes":{...}}`.

> **Free-tier note:** Render spins the service down after ~15 min idle, so the
> first request after a nap takes ~30–50s to cold-start. Mention this near your
> demo link so a reviewer isn't surprised by a slow first load.

---

## 2. Frontend → Vercel

1. Vercel dashboard → **Add New → Project** → import the same GitHub repo.
2. **Root Directory: `web`** (important — the React app lives in a subfolder).
   Vercel auto-detects the Vite preset and reads [`web/vercel.json`](web/vercel.json).
3. **Environment Variables** → add:
   ```
   VITE_API_BASE_URL = https://<your-render-url>.onrender.com
   ```
   > Vite inlines env vars **at build time**, so this must be set *before* the
   > first build. If you add it later, redeploy.
4. **Deploy.** You'll get a URL like `https://upi-offline-mesh.vercel.app`.

---

## 3. Wire CORS back to Vercel

The browser will block the frontend's API calls until the backend allows its
origin. On **Render → your service → Environment**, add:

```
CORS_ALLOWED_ORIGINS = https://*.vercel.app
```

The backend uses `allowedOriginPatterns`, so the `*` wildcard covers both your
production domain and Vercel's per-deploy preview URLs. For a tighter scope, use
the exact origin instead (e.g. `https://upi-offline-mesh.vercel.app`), or a
comma-separated list. Save → Render redeploys automatically.

Now open the Vercel URL: the header badge should read **backend connected** and
the demo should drive end to end.

---

## Local development

Two terminals:

```bash
# terminal 1 — backend on :8080
./mvnw spring-boot:run          # (mvnw.cmd on Windows PowerShell: .\mvnw.cmd spring-boot:run)

# terminal 2 — frontend on :5173 (proxies /api to :8080, no env var needed)
cd web && npm install && npm run dev
```

Open http://localhost:5173.
