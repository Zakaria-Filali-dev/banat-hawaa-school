-- Add approval status functionality to class sessions
-- This migration adds the approval_status column and related functionality

-- Add approval_status column to class_sessions table
ALTER TABLE class_sessions 
ADD COLUMN IF NOT EXISTS approval_status TEXT 
CHECK (approval_status IN ('pending', 'approved', 'rejected')) 
DEFAULT 'pending';

-- Add requested_by column to track who requested the session
ALTER TABLE class_sessions 
ADD COLUMN IF NOT EXISTS requested_by UUID 
REFERENCES profiles(id) ON DELETE SET NULL;

-- Add approved_by column to track who approved/rejected the session
ALTER TABLE class_sessions 
ADD COLUMN IF NOT EXISTS approved_by UUID 
REFERENCES profiles(id) ON DELETE SET NULL;

-- Add approval_date to track when the approval was made
ALTER TABLE class_sessions 
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;

-- Add rejection_reason for when sessions are rejected
ALTER TABLE class_sessions 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for approval status queries
CREATE INDEX IF NOT EXISTS idx_class_sessions_approval_status ON class_sessions(approval_status);

-- Create function to send notification when session status changes
CREATE OR REPLACE FUNCTION notify_session_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger for approval status changes
    IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
        -- Insert notification for the teacher who requested the session
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            priority,
            related_id
        ) VALUES (
            COALESCE(NEW.requested_by, NEW.teacher_id),
            CASE NEW.approval_status
                WHEN 'approved' THEN 'Session Approved ✅'
                WHEN 'rejected' THEN 'Session Rejected ❌'
                ELSE 'Session Status Updated'
            END,
            CASE NEW.approval_status
                WHEN 'approved' THEN 'Your session "' || NEW.title || '" has been approved and is now scheduled.'
                WHEN 'rejected' THEN 'Your session "' || NEW.title || '" has been rejected. ' || COALESCE('Reason: ' || NEW.rejection_reason, '')
                ELSE 'Session status has been updated to: ' || NEW.approval_status
            END,
            CASE NEW.approval_status
                WHEN 'approved' THEN 'session_approved'
                WHEN 'rejected' THEN 'session_rejected'
                ELSE 'session_update'
            END,
            CASE NEW.approval_status
                WHEN 'rejected' THEN 'high'
                ELSE 'normal'
            END,
            NEW.id
        );
        
        -- If session is approved, also notify admin about successful approval
        IF NEW.approval_status = 'approved' AND NEW.approved_by IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                title,
                message,
                type,
                priority,
                related_id
            ) VALUES (
                NEW.approved_by,
                'Session Approval Completed',
                'You have successfully approved the session "' || NEW.title || '".',
                'session_approval',
                'normal',
                NEW.id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session status notifications
DROP TRIGGER IF EXISTS trigger_session_status_notification ON class_sessions;
CREATE TRIGGER trigger_session_status_notification
    AFTER UPDATE ON class_sessions
    FOR EACH ROW EXECUTE FUNCTION notify_session_status_change();

-- Update existing sessions to have pending status if they don't have one
UPDATE class_sessions 
SET approval_status = 'approved', 
    requested_by = teacher_id,
    approved_by = teacher_id,
    approval_date = created_at
WHERE approval_status IS NULL;

-- Add RLS policies for session approvals
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can view own sessions and pending approvals" ON class_sessions;
DROP POLICY IF EXISTS "Teachers can create session requests" ON class_sessions;
DROP POLICY IF EXISTS "Teachers can update own sessions, admins can approve" ON class_sessions;
DROP POLICY IF EXISTS "Teachers and admins can delete sessions" ON class_sessions;
DROP POLICY IF EXISTS "Students can view approved sessions" ON class_sessions;

-- Allow teachers to view their own sessions and pending sessions they can approve
CREATE POLICY "Teachers can view own sessions and pending approvals" ON class_sessions
    FOR SELECT
    USING (
        auth.uid() = teacher_id OR 
        auth.uid() = requested_by OR
        (
            EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') AND
            approval_status = 'pending'
        )
    );

-- Allow students to view approved sessions for subjects they're enrolled in
CREATE POLICY "Students can view approved sessions" ON class_sessions
    FOR SELECT
    USING (
        approval_status = 'approved' AND
        EXISTS (
            SELECT 1 FROM student_subjects ss 
            WHERE ss.student_id = auth.uid() 
            AND ss.subject_id = class_sessions.subject_id 
            AND ss.status = 'active'
        )
    );

-- Allow teachers to create session requests
CREATE POLICY "Teachers can create session requests" ON class_sessions
    FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')) AND
        auth.uid() = teacher_id
    );

-- Allow teachers to update their own sessions (for editing) and admins to approve/reject
CREATE POLICY "Teachers can update own sessions, admins can approve" ON class_sessions
    FOR UPDATE
    USING (
        auth.uid() = teacher_id OR 
        auth.uid() = requested_by OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Allow teachers and admins to delete sessions
CREATE POLICY "Teachers and admins can delete sessions" ON class_sessions
    FOR DELETE
    USING (
        auth.uid() = teacher_id OR 
        auth.uid() = requested_by OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
