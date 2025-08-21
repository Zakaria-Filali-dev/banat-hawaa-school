-- Migration for Admin Management System
-- Adds messaging system and enhanced user management

-- Add admin messages table
CREATE TABLE IF NOT EXISTS admin_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add suspension tracking table
CREATE TABLE IF NOT EXISTS user_suspensions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reason_category TEXT NOT NULL,
    reason_details TEXT,
    suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsuspended_at TIMESTAMP WITH TIME ZONE NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_messages_recipient ON admin_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_read_status ON admin_messages(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_user ON user_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_active ON user_suspensions(user_id, is_active);

-- Add RLS policies for admin messages
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages sent to them
CREATE POLICY "Users can view their received messages" ON admin_messages
    FOR SELECT USING (recipient_id = auth.uid());

-- Users can update read status of their messages
CREATE POLICY "Users can update their message read status" ON admin_messages
    FOR UPDATE USING (recipient_id = auth.uid());

-- Admins can send messages to anyone
CREATE POLICY "Admins can send messages" ON admin_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages" ON admin_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add RLS policies for suspensions
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;

-- Users can view their own suspension records
CREATE POLICY "Users can view their suspensions" ON user_suspensions
    FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all suspension records
CREATE POLICY "Admins can manage suspensions" ON user_suspensions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to automatically update message timestamps
CREATE OR REPLACE FUNCTION update_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message updates
DROP TRIGGER IF EXISTS update_admin_messages_timestamp ON admin_messages;
CREATE TRIGGER update_admin_messages_timestamp
    BEFORE UPDATE ON admin_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_timestamp();
