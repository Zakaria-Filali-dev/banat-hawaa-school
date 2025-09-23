-- Enable RLS and create policies for missing tables
-- These policies are critical for data isolation and security

-- ASSIGNMENT ATTACHMENTS TABLE
ALTER TABLE assignment_attachments ENABLE ROW LEVEL SECURITY;

-- Teachers can manage attachments for their assignments
CREATE POLICY "Teachers can manage attachments for their assignments" ON assignment_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assignments a
            WHERE a.id = assignment_id AND a.teacher_id = auth.uid()
        )
    );

-- Students can view attachments for assignments in their enrolled subjects
CREATE POLICY "Students can view assignment attachments" ON assignment_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN student_subjects ss ON ss.subject_id = a.subject_id
            WHERE a.id = assignment_id 
            AND ss.student_id = auth.uid() 
            AND ss.status = 'active'
            AND a.is_published = true
        )
    );

-- Admins can manage all attachment files
CREATE POLICY "Admins can manage all assignment attachments" ON assignment_attachments
    FOR ALL USING (is_admin(auth.uid()));


-- SUBMISSION FILES TABLE  
ALTER TABLE submission_files ENABLE ROW LEVEL SECURITY;

-- Students can manage files for their own submissions
CREATE POLICY "Students can manage their submission files" ON submission_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assignment_submissions sub
            WHERE sub.id = submission_id AND sub.student_id = auth.uid()
        )
    );

-- Teachers can view submission files for their assignments
CREATE POLICY "Teachers can view submission files for their assignments" ON submission_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignment_submissions sub
            JOIN assignments a ON a.id = sub.assignment_id
            WHERE sub.id = submission_id AND a.teacher_id = auth.uid()
        )
    );

-- Admins can manage all submission files
CREATE POLICY "Admins can manage all submission files" ON submission_files
    FOR ALL USING (is_admin(auth.uid()));


-- CLASS ATTENDANCE TABLE
ALTER TABLE class_attendance ENABLE ROW LEVEL SECURITY;

-- Students can view their own attendance records
CREATE POLICY "Students can view their attendance" ON class_attendance
    FOR SELECT USING (student_id = auth.uid());

-- Teachers can manage attendance for their sessions
CREATE POLICY "Teachers can manage attendance for their sessions" ON class_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM class_sessions cs
            WHERE cs.id = session_id AND cs.teacher_id = auth.uid()
        )
    );

-- Admins can manage all attendance records
CREATE POLICY "Admins can manage all attendance records" ON class_attendance
    FOR ALL USING (is_admin(auth.uid()));