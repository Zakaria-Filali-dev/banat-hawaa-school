# Copilot Instructions for Tutoring School Management System

## Project Overview

This is a React + Vite + Supabase tutoring school management system with role-based access control (admin, teacher, student). The system uses concurrency to run both frontend (Vite) and backend (Express) servers simultaneously.

## Architecture & Key Patterns

### Role-Based Security Model

- **Database**: Profiles table with `role` column ('admin', 'teacher', 'student') linked to Supabase auth
- **Frontend**: `ProtectedRoute` component checks user role via `profiles` table lookup using `auth.uid()`
- **Backend**: Row Level Security (RLS) policies extensively used - always check existing policies before modifying tables
- **Authentication Flow**: Supabase auth + profile creation trigger (`handle_new_user()` function)

### Development Workflow

```bash
# Always use these commands for development
npm run dev          # Runs both frontend (5174) + backend (3000) with concurrency
npm run dev:safe     # Same as above but with restart delays for stability
start-dev.bat       # Windows batch script that kills existing processes first
```

### File Upload & Preview System

The project has a sophisticated file handling system:

- **`EnhancedFilePreview.jsx`**: Main preview component with download/fullscreen capabilities
- **`ImageViewer.jsx`**: Full-screen image viewer with zoom and carousel navigation
- **`SubmissionFilesViewer.jsx`**: Organizes files by type (images vs documents)
- **Pattern**: Always use these components instead of basic file displays

### Notification System Architecture

- **Real-time**: Uses Supabase real-time subscriptions in `NotificationCenter.jsx`
- **Database**: `notifications` table with `user_id`, `type`, `is_read`, `priority` columns
- **Navigation**: Notifications can trigger navigation using `handleNotificationClick()`
- **Types**: 'session_request', 'session_approved', 'session_rejected', 'assignment_due'

### Database Setup Pattern

- **Migration Files**: Use `supabase/migrations/` for proper schema changes
- **Database Functions**: Custom functions in `supabase/functions/`
- **RLS Policies**: Check `supabase/migrations/002_rls_policies.sql` for existing security patterns
- **Helper Functions**: Use existing functions like `is_admin()`, `get_user_role()`, `is_teacher_of_subject()`

## Development Guidelines

### Component Structure

- **Error Boundaries**: Wrap complex components with `ErrorBoundary.jsx`
- **Modal Pattern**: Use `MessageModal.jsx` for user feedback (success/error messages)
- **Styling**: Inline styles with `jsx` template literals, dark theme with glassmorphism effects
- **State Management**: React hooks with Supabase real-time subscriptions

### Database Operations

- **Always use RLS**: Never disable Row Level Security without good reason
- **Service Role**: Backend uses service role key for admin operations
- **Policies First**: Check existing RLS policies in `/supabase/migrations/002_rls_policies.sql`
- **User Context**: Frontend queries use `auth.uid()`, backend operations should respect user context

### File Naming Conventions

- **Pages**: `src/pages/{role}/{feature}.jsx` (e.g., `admin/admin.jsx`, `teacher/teacherDash.jsx`)
- **Components**: `src/components/{PascalCase}.jsx`
- **Database**: Use proper migrations in `supabase/migrations/` instead of ad-hoc SQL files

### Common Patterns to Follow

1. **Supabase Client**: Import from `src/services/supabaseClient.js` (configured for Vite)
2. **User Role Checking**: Always fetch role from `profiles` table, not from auth metadata
3. **Real-time Updates**: Use `.on('INSERT'|'UPDATE'|'DELETE')` for live data
4. **Error Handling**: Wrap Supabase operations in try-catch with user feedback
5. **File Upload**: Use existing file preview components rather than building new ones

### Avoid These Patterns

- Don't use generic file upload components - use the existing enhanced preview system
- Don't bypass RLS policies - work within the security model
- Don't use auth metadata for roles - always query the profiles table
- Don't create new notification patterns - extend the existing NotificationCenter system

## Key Files for Context

- **`src/App.jsx`**: Main routing and authentication logic
- **`api/server.mjs`**: Express backend with CORS and Supabase service role
- **`supabase/migrations/002_rls_policies.sql`**: All RLS policies and helper functions
- **`src/components/NotificationCenter.jsx`**: Real-time notification system
- **`package.json`**: Scripts for concurrent frontend/backend development
