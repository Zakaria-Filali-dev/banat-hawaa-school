-- 🔐 Row Level Security Policies
-- Run these after creating the tables

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role = 'admin' FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is teacher of subject
CREATE OR REPLACE FUNCTION is_teacher_of_subject(user_id UUID, subject_id_arg UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check both the old subjects.teacher_id field AND the new teacher_subjects table
    RETURN (
        (SELECT s.teacher_id = user_id FROM subjects s WHERE s.id = subject_id_arg) OR
        EXISTS (
            SELECT 1 FROM teacher_subjects ts 
            WHERE ts.teacher_id = user_id AND ts.subject_id = subject_id_arg
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if student is enrolled in subject
CREATE OR REPLACE FUNCTION is_student_enrolled(student_id_arg UUID, subject_id_arg UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM student_subjects 
        WHERE student_id = student_id_arg AND subject_id = subject_id_arg AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles in their subjects" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Teachers can view student profiles in their subjects" ON profiles
    FOR SELECT USING (
        role = 'student' AND EXISTS (
            SELECT 1 FROM student_subjects ss
            JOIN subjects s ON ss.subject_id = s.id
            WHERE ss.student_id = profiles.id AND s.teacher_id = auth.uid()
        )
    );

-- SUBJECTS POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view active subjects" ON subjects;
DROP POLICY IF EXISTS "Admins can manage all subjects" ON subjects;
DROP POLICY IF EXISTS "Teachers can update their assigned subjects" ON subjects;

CREATE POLICY "Everyone can view active subjects" ON subjects
    FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage all subjects" ON subjects
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Teachers can update their assigned subjects" ON subjects
    FOR UPDATE USING (teacher_id = auth.uid());

-- PENDING APPLICATIONS POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Only admins can view applications" ON pending_applications;
DROP POLICY IF EXISTS "Only admins can manage applications" ON pending_applications;
DROP POLICY IF EXISTS "Anyone can create applications" ON pending_applications;
DROP POLICY IF EXISTS "Admins can update/delete applications" ON pending_applications;

-- Allow anyone (including anonymous users) to create applications
CREATE POLICY "Anyone can create applications" ON pending_applications
    FOR INSERT WITH CHECK (true);

-- Only admins can view applications
CREATE POLICY "Only admins can view applications" ON pending_applications
    FOR SELECT USING (is_admin(auth.uid()));

-- Only admins can update/delete applications
CREATE POLICY "Admins can update/delete applications" ON pending_applications
    FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete applications" ON pending_applications
    FOR DELETE USING (is_admin(auth.uid()));

-- STUDENT SUBJECTS POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their enrollments" ON student_subjects;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON student_subjects;
DROP POLICY IF EXISTS "Teachers can view enrollments in their subjects" ON student_subjects;

CREATE POLICY "Students can view their enrollments" ON student_subjects
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can manage all enrollments" ON student_subjects
    FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Teachers can view enrollments in their subjects" ON student_subjects
    FOR SELECT USING (is_teacher_of_subject(auth.uid(), subject_id));

-- ANNOUNCEMENTS POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users see announcements based on audience" ON announcements;
DROP POLICY IF EXISTS "Admins can create school-wide announcements" ON announcements;
DROP POLICY IF EXISTS "Teachers can create subject announcements" ON announcements;
DROP POLICY IF EXISTS "Authors can update their announcements" ON announcements;

CREATE POLICY "Users see announcements based on audience" ON announcements
    FOR SELECT USING (
        is_published = true AND (
            target_audience = 'all' OR
            (target_audience = get_user_role(auth.uid())) OR
            (target_audience = 'subject_students' AND subject_id IS NOT NULL AND 
             is_student_enrolled(auth.uid(), subject_id))
        )
    );

CREATE POLICY "Admins can create school-wide announcements" ON announcements
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Teachers can create subject announcements" ON announcements
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) = 'teacher' AND
        (subject_id IS NULL OR is_teacher_of_subject(auth.uid(), subject_id))
    );

CREATE POLICY "Authors can update their announcements" ON announcements
    FOR UPDATE USING (author_id = auth.uid());

-- DOCUMENTS POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view public documents in their subjects" ON documents;
DROP POLICY IF EXISTS "Teachers can manage documents in their subjects" ON documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;

CREATE POLICY "Students can view public documents in their subjects" ON documents
    FOR SELECT USING (
        is_public = true AND 
        (subject_id IS NULL OR is_student_enrolled(auth.uid(), subject_id))
    );

CREATE POLICY "Teachers can manage documents in their subjects" ON documents
    FOR ALL USING (
        subject_id IS NULL AND get_user_role(auth.uid()) = 'teacher' OR
        is_teacher_of_subject(auth.uid(), subject_id)
    );

CREATE POLICY "Admins can manage all documents" ON documents
    FOR ALL USING (is_admin(auth.uid()));

-- ASSIGNMENTS POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view assignments in their subjects" ON assignments;
DROP POLICY IF EXISTS "Teachers can manage assignments in their subjects" ON assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON assignments;

CREATE POLICY "Students can view assignments in their subjects" ON assignments
    FOR SELECT USING (
        is_published = true AND is_student_enrolled(auth.uid(), subject_id)
    );

CREATE POLICY "Teachers can manage assignments in their subjects" ON assignments
    FOR ALL USING (is_teacher_of_subject(auth.uid(), subject_id));

CREATE POLICY "Admins can view all assignments" ON assignments
    FOR SELECT USING (is_admin(auth.uid()));

-- ASSIGNMENT SUBMISSIONS POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view/create their own submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Teachers can view submissions for their assignments" ON assignment_submissions;
DROP POLICY IF EXISTS "Teachers can grade submissions for their assignments" ON assignment_submissions;

CREATE POLICY "Students can view/create their own submissions" ON assignment_submissions
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their assignments" ON assignment_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a
            WHERE a.id = assignment_id AND is_teacher_of_subject(auth.uid(), a.subject_id)
        )
    );

CREATE POLICY "Teachers can grade submissions for their assignments" ON assignment_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM assignments a
            WHERE a.id = assignment_id AND is_teacher_of_subject(auth.uid(), a.subject_id)
        )
    );

-- NOTIFICATIONS POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true); 
-- Will be handled by backend with service role