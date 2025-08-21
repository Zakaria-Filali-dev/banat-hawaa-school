# Supabase Production Configuration

## After your site is deployed, update Supabase settings:

### 1. Update Site URL in Supabase

- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project: `ilqxgmdhtwumjjdyvmvt`
- Go to **Authentication** → **URL Configuration**
- Update **Site URL** to: `https://your-vercel-url.vercel.app`

### 2. Update Redirect URLs

- In **Redirect URLs**, add:
  - `https://your-vercel-url.vercel.app/login`
  - `https://your-vercel-url.vercel.app/register`
  - `https://your-vercel-url.vercel.app/admin`
  - `https://your-vercel-url.vercel.app/teacher`
  - `https://your-vercel-url.vercel.app/student`

### 3. CORS Configuration

- Go to **API** → **CORS**
- Add your Vercel domain: `https://your-vercel-url.vercel.app`

### 4. RLS Policies Check

- Ensure all Row Level Security policies are enabled
- Test authentication flow on live site

## Testing Checklist:

- [ ] Landing page loads correctly
- [ ] Registration works
- [ ] Login works
- [ ] Role-based routing works
- [ ] Images load properly
- [ ] Animations work smoothly
