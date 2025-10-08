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

- `VITE_SUPABASE_URL` = `your_supabase_url_here`
- `VITE_SUPABASE_ANON_KEY` = `your_supabase_anon_key_here`

**Private Variables (server-side only):**

- `SUPABASE_URL` = `your_supabase_url_here`
- `SUPABASE_SERVICE_ROLE_KEY` = `your_supabase_service_role_key_here`
- `SMTP_HOST` = `smtp-relay.brevo.com`
- `SMTP_PORT` = `587`
- `SMTP_USER` = `your_brevo_username_here`
- `SMTP_PASS` = `your_brevo_password_here`
- `SMTP_FROM` = `YOUR-SCHOOL-NAME <your_email@domain.com>`
- `FRONTEND_URL` = `https://your-app-name.vercel.app`

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
