# 📧 Configure Email for User Invitations

## Problem

When you accept applications, no invitation emails are sent because Supabase email isn't configured.

## Solution: Configure Supabase Auth Email

### Step 1: Go to Supabase Dashboard

1. Go to your project at https://supabase.com
2. Navigate to **Authentication** → **Settings**

### Step 2: Configure Email Settings

1. Scroll to **SMTP Settings**
2. Enable **"Enable custom SMTP"**
3. Fill in these details:

```
SMTP Host: smtp.gmail.com
SMTP Port: 465
SMTP User: zakifilali42@gmail.com
SMTP Pass: [Your Gmail App Password]
```

### Step 3: Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Update **"Invite user"** template:

**Subject**: Welcome to Banat Hawaa School - Set Up Your Account

**Message Body**:

```html
<h2>Welcome to Banat Hawaa School!</h2>
<p>Hello!</p>
<p>
  You've been approved to join our online tutoring platform. Please click the
  link below to set up your password and activate your account:
</p>
<p><a href="{{ .ConfirmationURL }}">Set Up Your Account</a></p>
<p>This link will expire in 24 hours.</p>
<p>If you have any questions, feel free to contact us.</p>
<p>Best regards,<br />Banat Hawaa School Team</p>
```

### Step 4: Set Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://banat-hawaa-school.vercel.app`
3. Add **Redirect URLs**:
   - `https://banat-hawaa-school.vercel.app/login`
   - `https://banat-hawaa-school.vercel.app`

### Step 5: Configure From Email (Important!)

1. In SMTP Settings, set **"From Email"** to: `zakifilali42@gmail.com`
2. Make sure this email is verified in your Brevo account

### Step 6: Test

1. Accept a new application
2. Check if invitation email is sent
3. User can click link to set password

## Alternative: Manual Process (Until Email is Set Up)

1. **Accept application in admin panel**
2. **Manually create user in Supabase Auth**:
   - Go to Authentication → Users → Invite User
   - Enter their email
   - Send them the invitation link manually
3. **Or give them temporary credentials** and ask them to change password after first login

## Notes

- Make sure your live site URL is correct
- Test with a real email address
- Check spam folder for invitation emails
