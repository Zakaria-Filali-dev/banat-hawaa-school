-- Enable RLS and create policies for teacher_subjects table
-- This table manages which teachers are assigned to which subjects

-- Create helper function if it doesn't exist
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role = 'admin' FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can view their own subject assignments
CREATE POLICY "Teachers can view their subject assignments" ON teacher_subjects
    FOR SELECT USING (teacher_id = auth.uid());

-- Policy: Admins can manage all teacher-subject assignments
CREATE POLICY "Admins can manage all teacher assignments" ON teacher_subjects
    FOR ALL USING (is_admin(auth.uid()));

-- Policy: Only admins can create new teacher-subject assignments
CREATE POLICY "Only admins can create teacher assignments" ON teacher_subjects
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Policy: Only admins can update teacher-subject assignments
CREATE POLICY "Only admins can update teacher assignments" ON teacher_subjects
    FOR UPDATE USING (is_admin(auth.uid()));

-- Policy: Only admins can delete teacher-subject assignments  
CREATE POLICY "Only admins can delete teacher assignments" ON teacher_subjects
    FOR DELETE USING (is_admin(auth.uid()));