# Supabase SMTP Configuration Guide

## The Problem

The error "Authentication failed: Error sending invite email" occurs because **Supabase needs its own SMTP configuration** in the Supabase Dashboard, separate from your Vercel environment variables.

## The Solution

### Step 1: Configure SMTP in Supabase Dashboard

1. **Go to your Supabase Dashboard**

   - Visit https://supabase.com/dashboard
   - Select your project: `banat-hawaa-school`

2. **Navigate to Authentication Settings**

   - Go to `Authentication` → `Settings` → `SMTP Settings`

   **ALSO IMPORTANT**: Check `Authentication` → `URL Configuration`:

   - **Site URL**: `https://banat-hawaa-school.vercel.app`
   - **Redirect URLs**: Add ALL of these URLs (one per line):
     ```
     https://banat-hawaa-school.vercel.app/auth/callback
     https://banat-hawaa-school.vercel.app/login
     https://banat-hawaa-school.vercel.app/register
     https://banat-hawaa-school.vercel.app
     ```

   **Why each URL is needed:**

   - `/auth/callback` - For email invitations and confirmations
   - `/login` - For regular login redirects
   - `/register` - For registration confirmations
   - Root domain - For general authentication flows

3. **Configure Gmail SMTP Settings**

   ```
   Enable custom SMTP: ✅ YES

   SMTP Settings:
   - Host: smtp.gmail.com
   - Port: 465
   - Username: zakifilali42@gmail.com
   - Password: [Your Gmail App Password]
   - Sender Email: (the email you want invitations to come from)
   - Sender Name: Banat Hawaa School
   ```

4. **Configure Email Templates (Optional but Recommended)**
   - You can customize the invitation email template
   - **IMPORTANT**: Make sure the redirect URL points to: `https://banat-hawaa-school.vercel.app/auth/callback`
   - The final URL will be: `https://banat-hawaa-school.vercel.app/auth/callback?token_hash={{ .TokenHash }}&type=invite`

### Step 2: Test the Configuration

1. **Save the SMTP settings in Supabase Dashboard**
2. **Wait 2-3 minutes for the changes to propagate**
3. **Try creating a teacher again from your admin panel**

### Step 3: Verify Email Delivery

1. **Check Gmail Sent Folder**

   - Log into your Gmail account
   - Check the Sent folder for outgoing emails
   - Look for any delivery failures or bounced emails

2. **Check Supabase Auth Logs**
   - In your Supabase Dashboard, go to `Authentication` → `Logs`
   - Look for any error messages related to email sending

## Important Notes

⚠️ **The environment variables in Vercel (SMTP\_\*) are NOT used by Supabase's email system**
✅ **Supabase has its own email configuration that must be set in the Supabase Dashboard**
🔄 **After configuring SMTP, it may take a few minutes to take effect**

## Testing the Fix

After configuring Supabase SMTP:

1. Go to: https://banat-hawaa-school.vercel.app
2. Log in as admin
3. Try creating a teacher
4. You should see "Teacher account created successfully and invitation email sent!"
5. Check the target email inbox for the invitation

## Troubleshooting

If it still doesn't work:

1. **Test the diagnostic endpoint**: https://banat-hawaa-school.vercel.app/api/test-email
2. **Check Supabase Auth logs** for specific error messages
3. **Verify Gmail SMTP credentials** are correct in Supabase Dashboard
4. **Make sure you're using the Gmail App Password** (not regular password)

## Why This Happens

- Supabase's `auth.admin.inviteUserByEmail()` uses Supabase's own email service
- This service requires SMTP configuration in the Supabase Dashboard
- Environment variables in your app (Vercel) don't affect Supabase's email system
- The Gmail credentials need to be entered directly in Supabase's SMTP settings
