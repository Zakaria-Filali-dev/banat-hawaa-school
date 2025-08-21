# Vercel Deployment Instructions

## Option A: Deploy via Vercel Dashboard (Recommended)

### 1. Create Vercel Account

- Go to [vercel.com](https://vercel.com)
- Sign up with your GitHub account
- Authorize Vercel to access your repositories

### 2. Import Project

- Click "New Project"
- Select your `banat-hawaa-school` repository
- Click "Import"

### 3. Configure Project

- **Framework Preset**: Vite
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Environment Variables

Click "Environment Variables" and add these **one by one**:

**Public Variables (available in browser):**

- `VITE_SUPABASE_URL` = `https://ilqxgmdhtwumjjdyvmvt.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscXhnbWRodHd1bWpqZHl2bXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NjMxNTgsImV4cCI6MjA2NjIzOTE1OH0.MIi6s5h-JEJ70vgszDljvQXS9sENWFF337D1tpXizrw`

**Private Variables (server-side only):**

- `SUPABASE_URL` = `https://ilqxgmdhtwumjjdyvmvt.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscXhnbWRodHd1bWpqZHl2bXZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY2MzE1OCwiZXhwIjoyMDY2MjM5MTU4fQ.GiqPUjsZtUijOOyLfmi-RI0sMQmAITdPBnSZapEECn8`
- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `465`
- `SMTP_USER` = `zakifilali42@gmail.com`
- `SMTP_PASS` = `mdfv xfmq hinf rcdh`
- `SMTP_FROM` = `BANAT-HAWAA-SCHOOL <zakifilali42@gmail.com>`

**Note**: The FRONTEND_URL will be automatically set by Vercel

### 5. Deploy

- Click "Deploy"
- Wait for build to complete (2-5 minutes)
- Get your live URL (e.g., `https://banat-hawaa-school.vercel.app`)

### 6. Update Frontend URL

- Copy your live Vercel URL
- Go back to Environment Variables
- Add: `FRONTEND_URL` = `your-live-vercel-url`
- Redeploy (this updates invite redirects)

## Option B: Deploy via Vercel CLI

### 1. Install Vercel CLI

```powershell
npm install -g vercel
```

### 2. Login and Deploy

```powershell
vercel login
vercel --prod
```

### 3. Follow prompts and add environment variables when asked
