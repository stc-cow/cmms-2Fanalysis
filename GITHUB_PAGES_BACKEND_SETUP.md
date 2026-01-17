# GitHub Pages Deployment with Express Backend

## Architecture

```
┌─────────────────────────────────────────┐
│   GitHub Pages (Static React App)       │
│   https://stc-cow.github.io/            │
└──────────────────┬──────────────────────┘
                   │ (HTTP Requests)
                   ▼
┌─────────────────────────────────────────┐
│   Backend Server (Express)               │
│   Handles API Endpoints:                │
│   • /api/data/processed-data            │
│   • /api/data/never-moved-cows          │
│   • /api/data/diagnostic                │
│   (Running on your server/cloud)        │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│   Google Sheets (CSV)                    │
│   Single Source of Truth                │
│   - GID: 1539310010 (Movements)          │
│   - GID: 1685376708 (Never-Moved-COWs)  │
└─────────────────────────────────────────┘
```

## Deployment Steps

### 1. Deploy Frontend (React App) to GitHub Pages

This is already configured. Just push to `main`:

```bash
git push origin main
# GitHub Actions will build and deploy to /docs folder
```

### 2. Deploy Backend (Express Server)

You need a separate server to host the Express backend. Options:

#### Option A: Railway.app (Recommended - Free tier available)

```bash
# 1. Sign up at railway.app
# 2. Connect your GitHub repo
# 3. Set start command: npm run dev
# 4. Deploy
# 5. Get your URL: https://your-project.railway.app
```

#### Option B: Render.com (Free tier available)

```bash
# 1. Sign up at render.com
# 2. Create new Web Service
# 3. Connect GitHub repo
# 4. Set Build: npm install
# 5. Set Start: npm run dev
# 6. Deploy
# 7. Get your URL: https://your-service.onrender.com
```

#### Option C: Fly.io

```bash
# 1. Install flyctl
# 2. Run: fly launch
# 3. Deploy: fly deploy
```

#### Option D: Self-hosted (VPS/Cloud)

```bash
# SSH into your server and:
git clone <your-repo>
cd <your-repo>
npm install
npm run dev  # or use PM2/systemd
```

### 3. Configure Frontend to Use Backend

#### For Development (Local):

```bash
# .env.development (optional - defaults to /api)
VITE_API_BASE_URL=http://localhost:8080
```

#### For Production (GitHub Pages):

```bash
# .env.production
VITE_API_BASE_URL=https://your-backend-server.com
```

Or set via GitHub Actions:

**File: `.github/workflows/jekyll-gh-pages.yml`**

```yaml
- name: Build with environment variables
  env:
    VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
  run: pnpm run build:client
```

Then add secret in GitHub:

1. Go to Repo → Settings → Secrets → New repository secret
2. Name: `API_BASE_URL`
3. Value: `https://your-backend-server.com`

### 4. Handle CORS (Important!)

The backend needs to allow requests from your GitHub Pages domain.

**Update `server/index.ts`:**

```typescript
import cors from "cors";

const app = express();

// Configure CORS for GitHub Pages
app.use(
  cors({
    origin: [
      "https://stc-cow.github.io", // GitHub Pages
      "http://localhost:3000", // Local dev
      "http://localhost:8080", // Local dev Vite
    ],
    methods: ["GET", "POST"],
    credentials: true,
  }),
);
```

Install CORS package:

```bash
npm install cors
```

### 5. Test the Connection

#### Local Development:

```bash
# Terminal 1: Start backend
npm run dev
# Will run on http://localhost:8080

# Terminal 2: Test in browser
# Open http://localhost:8080
# Check browser console for API success messages
```

#### Production (GitHub Pages):

```bash
# After deploying backend:
# 1. Update VITE_API_BASE_URL in GitHub secrets
# 2. Push to main: git push origin main
# 3. Wait for GitHub Actions to build
# 4. Visit https://stc-cow.github.io
# 5. Open browser DevTools → Console
# 6. Should see: "✓ Loaded data: X movements, Y cows"
```

### 6. Troubleshooting

#### Error: "Failed to load data from API: API error: 404"

- ✓ Backend URL is wrong in `VITE_API_BASE_URL`
- ✓ Backend is not running
- ✓ Endpoint path is incorrect

#### Error: "CORS error"

- ✓ Backend doesn't have CORS enabled
- ✓ Frontend domain not in CORS whitelist
- ✓ Check backend logs

#### Error: "Timeout"

- ✓ Backend is too slow (Google Sheets fetch taking too long)
- ✓ Network issue
- ✓ Backend is offline

### 7. Monitoring

Check backend health:

```bash
curl https://your-backend-server.com/api/data/diagnostic
```

Should return JSON with:

- Source of truth (Google Sheet URL)
- CSV accessibility status
- Recommendations

## Environment Variables Summary

| Variable            | Dev Default       | Prod Default | Example                   |
| ------------------- | ----------------- | ------------ | ------------------------- |
| `VITE_API_BASE_URL` | `/api` (relative) | Must set     | `https://api.railway.app` |
| `GITHUB_PAGES`      | Not set           | `true`       | (set by GitHub Actions)   |
| `GITHUB_REPOSITORY` | Not set           | `owner/repo` | (set by GitHub Actions)   |

## Security Notes

- ✓ Backend should validate requests
- ✓ Use HTTPS in production
- ✓ Don't expose sensitive credentials in frontend
- ✓ Use GitHub Secrets for environment variables
- ✓ Consider rate limiting on backend API

## File Changes Made

1. ✅ `client/hooks/useDashboardData.ts` - Uses `VITE_API_BASE_URL`
2. ✅ `client/pages/Dashboard.tsx` - Uses `VITE_API_BASE_URL`
3. ✅ `netlify.toml` - REMOVED
4. ✅ `vercel.json` - REMOVED
5. ✅ `.env.example` - Created (reference template)

## Next Steps

1. **Choose a hosting provider** (Railway, Render, Fly, or self-hosted)
2. **Deploy the backend** (see Option A/B/C/D above)
3. **Get your backend URL**
4. **Set `VITE_API_BASE_URL` in GitHub Secrets** (for production)
5. **Push to main** - GitHub Actions will deploy
6. **Verify** at https://stc-cow.github.io

---

Questions? Check the API endpoint directly:

```bash
curl https://your-backend-server.com/api/data/diagnostic
```

This will show detailed information about connectivity to Google Sheets.
