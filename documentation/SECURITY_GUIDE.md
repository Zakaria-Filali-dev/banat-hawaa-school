# 🔒 SECURITY GUIDE - SENSITIVE FILES PROTECTION

## ⚠️ CRITICAL: Files That Must NEVER Be Public

### 1. Environment Files (.env)

**NEVER COMMIT THESE FILES:**

- `.env` - Contains ALL sensitive data
- `.env.local`, `.env.production`, etc.

**What's sensitive in .env:**

```
SUPABASE_SERVICE_ROLE_KEY=... (CRITICAL - Full database access)
SMTP_PASS=... (Email password)
SMTP_USER=... (Email address)
```

### 2. Supabase Keys Explanation

- **VITE_SUPABASE_ANON_KEY**: ✅ Safe to be public (read-only, RLS protected)
- **SUPABASE_SERVICE_ROLE_KEY**: ❌ NEVER PUBLIC (bypasses all security)

## ✅ Security Verification Checklist

### Before Pushing to GitHub:

- [ ] `.env` is in `.gitignore`
- [ ] No API keys in source code
- [ ] No passwords in comments
- [ ] No database URLs with credentials

### Check Command:

```powershell
# Verify .env is not tracked by git
git status
# Should NOT show .env file

# If .env appears, it means it's being tracked - STOP!
```

## 🚨 If You Accidentally Expose Sensitive Data

### Immediate Actions:

1. **Rotate ALL credentials immediately**
2. **Change Supabase service role key**
3. **Change email app password**
4. **Remove sensitive commits from git history**

### Supabase Key Rotation:

1. Go to Supabase Dashboard
2. Settings → API
3. Click "Reset" next to Service Role Key
4. Update your local .env file
5. Update Vercel environment variables

## 🔐 Proper Deployment Security

### Environment Variables Setup:

**Local Development (.env) - PRIVATE:**

```env
SUPABASE_SERVICE_ROLE_KEY=super_secret_key_here
SMTP_PASS=your_email_password
```

**Vercel Deployment - Environment Variables Panel:**

- Add sensitive variables through Vercel dashboard
- Never put them in code or config files
- Use different keys for production if possible

### Public vs Private Variables:

**✅ Safe for Public (VITE\_ prefix):**

- `VITE_SUPABASE_URL` - Public database URL
- `VITE_SUPABASE_ANON_KEY` - Public read-only key
- `VITE_APP_NAME` - Application name

**❌ Must Stay Private (Server-side only):**

- `SUPABASE_SERVICE_ROLE_KEY` - Full database access
- `SMTP_PASS` - Email password
- `SMTP_USER` - Email username
- Any API keys with write access

## 🛡️ Additional Security Measures

### 1. Code Security

- Never hardcode secrets in source code
- Use environment variables for all sensitive data
- Review code before committing

### 2. Database Security

- Keep RLS (Row Level Security) enabled
- Regular security policy audits
- Monitor access logs

### 3. Email Security

- Use app-specific passwords for Gmail
- Consider using dedicated email service
- Monitor for unauthorized access

## ⚡ Quick Security Check Script

Run this before pushing to GitHub:

```powershell
# Check if .env will be committed (should be empty)
git ls-files | findstr "\.env"

# Search for potential secrets in code
findstr /S /I "password\|secret\|key.*=" src\

# Verify .gitignore is working
git check-ignore .env
# Should output: .env
```

## 🎯 Summary: What Gets Committed vs What Stays Local

### ✅ Committed to GitHub (Public):

- Source code (src/)
- Configuration files (vite.config.js, package.json)
- .env.example (template with placeholders)
- Documentation and guides
- Build configurations

### ❌ Never Committed (Local Only):

- .env (actual credentials)
- Database backups
- Personal API keys
- Email passwords
- Service role keys

**Remember: When in doubt, DON'T commit it. It's easier to add a file later than to remove sensitive data from git history!**
