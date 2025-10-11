# Gmail SMTP Configuration for Supabase

## Overview

This guide configures Gmail SMTP with Supabase to fix mobile email redirect issues. Gmail SMTP provides better mobile compatibility compared to Brevo.

## Prerequisites

1. Gmail account with 2-Factor Authentication enabled
2. Gmail App Password generated (not your regular Gmail password)
3. Access to Supabase Dashboard

## Step 1: Configure Gmail App Password

### 1.1 Enable 2-Factor Authentication

1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled

### 1.2 Generate App Password

1. In Google Account Security settings
2. Click "App passwords"
3. Select "Mail" as the app
4. Select "Other" as the device type
5. Name it "Banat Hawaa School SMTP"
6. **Copy the 16-character password** (e.g., "abcd efgh ijkl mnop")

## Step 2: Configure Supabase SMTP Settings

### 2.1 Access Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select project: `banat-hawaa-school`
3. Navigate to `Authentication` → `Settings` → `SMTP Settings`

### 2.2 Gmail SMTP Configuration

```
Enable custom SMTP: ✅ YES

SMTP Settings:
- Host: smtp.gmail.com
- Port: 465 (SSL) or 587 (TLS) - recommended: 465
- Username: zakifilali42@gmail.com
- Password: [Your 16-character Gmail App Password]
- Sender Email: zakifilali42@gmail.com
- Sender Name: Banat Hawaa School
```

### 2.3 Configure Redirect URLs

In `Authentication` → `URL Configuration`:

**Site URL**: `https://banat-hawaa-school.vercel.app`

**Redirect URLs** (add each on separate line):

```
https://banat-hawaa-school.vercel.app/auth/callback
https://banat-hawaa-school.vercel.app/auth/set-password
https://banat-hawaa-school.vercel.app/login
https://banat-hawaa-school.vercel.app/register
https://banat-hawaa-school.vercel.app
```

## Step 3: Update Email Templates

### 3.1 Customize Invitation Template

Go to `Authentication` → `Email Templates` → `Invite user`:

**Subject**:

```
Welcome to Banat Hawaa School - Complete Your Registration
```

**Message Body**:

```html
<div
  style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"
>
  <div
    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;"
  >
    <h1 style="color: white; margin: 0; font-size: 28px;">
      Welcome to Banat Hawaa School! 🎓
    </h1>
  </div>

  <div
    style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
  >
    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
      Hello! You've been invited to join our online tutoring platform.
    </p>

    <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
      Click the button below to set up your password and activate your account:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a
        href="{{ .ConfirmationURL }}"
        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: bold; 
                font-size: 16px; 
                display: inline-block;"
      >
        Complete Registration ✨
      </a>
    </div>

    <p
      style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;"
    >
      This link will expire in 24 hours. If you have any questions, contact our
      support team.
    </p>
  </div>

  <div
    style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;"
  >
    © 2025 Banat Hawaa School - Quality Online Education
  </div>
</div>
```

## Step 4: Update Environment Variables

Update your `.env` file to reflect Gmail configuration:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=zakifilali42@gmail.com
SMTP_PASS=mdfv xfmq hinf rcdh
SMTP_FROM=Banat Hawaa School <zakifilali42@gmail.com>
```

## Step 5: Testing

### 5.1 Test Invitation Flow

1. Go to admin panel
2. Try inviting a new student/teacher
3. Check email delivery in recipient inbox
4. Verify mobile email links work without redirects

### 5.2 Monitor Email Delivery

1. Check Gmail "Sent" folder for outgoing emails
2. Monitor for any delivery failures
3. Test on both desktop and mobile devices

## Mobile Compatibility Benefits

### Why Gmail SMTP is Better for Mobile:

1. **No redirect issues**: Gmail SMTP doesn't trigger mobile browser redirects like Brevo
2. **Better deliverability**: Gmail has excellent reputation with email providers
3. **Consistent rendering**: Gmail-sent emails render consistently across mobile clients
4. **Faster delivery**: Gmail SMTP typically has faster delivery times
5. **No third-party dependencies**: Direct Gmail connection eliminates Brevo proxy issues

### Mobile-Specific Improvements:

- Email links open directly in mobile browsers without intermediate redirects
- Better handling of deep links on iOS/Android
- Improved email rendering on mobile email clients
- Reduced likelihood of emails being marked as spam

## Troubleshooting

### Common Issues:

1. **"Invalid credentials"**: Double-check the 16-character App Password
2. **"Less secure app"**: Make sure you're using App Password, not regular password
3. **Port issues**: Try port 587 if 465 doesn't work
4. **Mobile redirects**: Clear browser cache and test with different mobile browsers

### Testing Commands:

```bash
# Test email functionality
curl https://banat-hawaa-school.vercel.app/api/diagnostic

# Check Supabase auth logs
# Go to Supabase Dashboard → Authentication → Logs
```

## Security Notes

- Gmail App Passwords are more secure than regular passwords
- Each App Password is unique and can be revoked independently
- Gmail SMTP uses encrypted connections (SSL/TLS)
- No sensitive data is stored in environment variables beyond what's necessary

## Migration Notes

When switching from Brevo to Gmail:

1. Previous Brevo configuration will be overridden
2. Existing users won't be affected
3. New invitations will use Gmail SMTP immediately
4. Monitor email delivery for first 24 hours after switch

## Support

If issues persist:

1. Check Supabase Authentication logs
2. Verify Gmail App Password is correct
3. Test with a different email address
4. Contact support with specific error messages
