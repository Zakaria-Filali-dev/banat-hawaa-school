-- 📅 Class Schedule and Session Management Tables
-- Add these tables to complete the tutoring platform

-- 1. Create class_sessions table for scheduled classes
CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    session_type TEXT DEFAULT 'regular' CHECK (session_type IN ('regular', 'exam', 'review', 'makeup', 'extra')),
    max_students INTEGER DEFAULT 20,
    is_cancelled BOOLEAN DEFAULT false,
    cancellation_reason TEXT,
    recurring_pattern TEXT CHECK (recurring_pattern IN ('weekly', 'biweekly', 'monthly', 'none')) DEFAULT 'none',
    recurring_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create class_attendance table to track student attendance
CREATE TABLE IF NOT EXISTS class_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')) DEFAULT 'absent',
    arrival_time TIME,
    notes TEXT,
    marked_by UUID REFERENCES profiles(id),
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- 3. Create assignment_attachments table for better file management
CREATE TABLE IF NOT EXISTS assignment_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    caption TEXT,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create submission_files table for student submission attachments
CREATE TABLE IF NOT EXISTS submission_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    caption TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_class_sessions_subject ON class_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_teacher ON class_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(session_date, start_time);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON class_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON class_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_attachments_assignment ON assignment_attachments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submission_files_submission ON submission_files(submission_id);

-- Add triggers for updated_at
CREATE TRIGGER update_class_sessions_updated_at BEFORE UPDATE ON class_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically enroll students in class sessions
CREATE OR REPLACE FUNCTION auto_enroll_students_in_session()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new class session is created, automatically create attendance records
    -- for all students enrolled in that subject
    INSERT INTO class_attendance (session_id, student_id, status)
    SELECT NEW.id, ss.student_id, 'absent'
    FROM student_subjects ss
    WHERE ss.subject_id = NEW.subject_id 
    AND ss.status = 'active';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-enrollment
CREATE TRIGGER trigger_auto_enroll_students 
    AFTER INSERT ON class_sessions
    FOR EACH ROW EXECUTE FUNCTION auto_enroll_students_in_session();

-- Add sample class sessions
INSERT INTO class_sessions (subject_id, teacher_id, title, description, session_date, start_time, end_time, location, session_type, recurring_pattern) VALUES
    (
        (SELECT id FROM subjects WHERE name = 'Mathematics' LIMIT 1),
        (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1),
        'Algebra Fundamentals',
        'Introduction to algebraic expressions and equations',
        CURRENT_DATE + INTERVAL '1 day',
        '10:00:00',
        '11:30:00',
        'Room 101',
        'regular',
        'weekly'
    ),
    (
        (SELECT id FROM subjects WHERE name = 'Physics' LIMIT 1),
        (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1),
        'Forces and Motion',
        'Understanding Newton''s laws of motion',
        CURRENT_DATE + INTERVAL '2 days',
        '14:00:00',
        '15:30:00',
        'Lab 201',
        'regular',
        'weekly'
    );
