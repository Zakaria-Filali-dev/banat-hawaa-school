# 🎓 Tutoring School Database Schema

## Overview

This document outlines the complete database structure for the tutoring school management system.

## Tables Structure

### 1. **profiles** (User Management)

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    phone TEXT,
    address TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. **subjects** (Course/Subject Management)

```sql
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. **pending_applications** (Student Applications)

```sql
CREATE TABLE pending_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    phone TEXT,
    address TEXT,
    parent_name TEXT,
    parent_email TEXT,
    parent_phone TEXT,
    subjects TEXT[] NOT NULL, -- Array of subject names they want to enroll in
    motivation TEXT, -- Why they want to join
    previous_experience TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. **student_subjects** (Student-Subject Enrollment)

```sql
CREATE TABLE student_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    UNIQUE(student_id, subject_id)
);
```

### 5. **parent_student_relationships** (Parent-Student Links)

```sql
CREATE TABLE parent_student_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('father', 'mother', 'guardian')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);
```

### 6. **announcements** (School-wide & Subject-specific Announcements)

```sql
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES profiles(id),
    subject_id UUID REFERENCES subjects(id), -- NULL for school-wide announcements
    target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'students', 'teachers', 'parents', 'subject_students')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. **documents** (Learning Materials & Resources)

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'pdf', 'doc', 'image', 'video', etc.
    file_size BIGINT,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    subject_id UUID REFERENCES subjects(id), -- NULL for general documents
    document_type TEXT NOT NULL CHECK (document_type IN ('lesson', 'assignment', 'resource', 'announcement_attachment')),
    is_public BOOLEAN DEFAULT false, -- If true, visible to all students in subject
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. **assignments** (Teacher Assignments)

```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    teacher_id UUID NOT NULL REFERENCES profiles(id),
    due_date TIMESTAMP WITH TIME ZONE,
    max_score INTEGER DEFAULT 100,
    is_published BOOLEAN DEFAULT false,
    allow_late_submission BOOLEAN DEFAULT false,
    submission_format TEXT DEFAULT 'image' CHECK (submission_format IN ('image', 'document', 'text', 'any')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9. **assignment_submissions** (Student Assignment Submissions)

```sql
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_urls TEXT[], -- Array of file URLs for image/document submissions
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_late BOOLEAN DEFAULT false,
    score INTEGER,
    feedback TEXT,
    graded_by UUID REFERENCES profiles(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
    UNIQUE(assignment_id, student_id)
);
```

### 10. **notifications** (System Notifications)

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('announcement', 'assignment', 'grade', 'system', 'reminder')),
    related_id UUID, -- ID of related object (assignment, announcement, etc.)
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

### profiles

- Users can view their own profile
- Admins can view/edit all profiles
- Teachers can view student profiles in their subjects
- Parents can view their children's profiles

### subjects

- Everyone can view active subjects
- Only admins can create/edit subjects
- Teachers can edit subjects they're assigned to

### pending_applications

- Only admins can view/manage applications
- Applicants can view their own application status

### announcements

- Users see announcements based on target_audience
- Subject-specific announcements only visible to enrolled students/teachers

### assignments & submissions

- Students see assignments for their enrolled subjects
- Teachers see assignments for their subjects
- Parents can view their children's assignments

## Storage Buckets

### document-uploads

- For lesson materials, resources, announcements attachments

### assignment-submissions

- For student assignment submissions (images, documents)

### profile-avatars

- For user profile pictures

### public-assets

- For school logos, public documents, etc.
