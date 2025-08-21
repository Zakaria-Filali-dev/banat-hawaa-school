import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
}

// Create service role client to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export default async function deleteMessageHandler(req, res) {
    console.log('Delete message handler called');
    console.log('Request method:', req.method);
    console.log('Request body:', req.body);

    if (req.method !== 'DELETE') {
        console.log('Method not allowed:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { messageId } = req.body;
        console.log('Extracted messageId:', messageId);

        if (!messageId) {
            console.log('No messageId provided');
            return res.status(400).json({ error: 'Message ID is required' });
        }

        // Verify the message exists first
        console.log('Checking if message exists...');
        const { data: existingMessage, error: fetchError } = await supabase
            .from('admin_messages')
            .select('id')
            .eq('id', messageId)
            .single();

        console.log('Existing message:', existingMessage);
        console.log('Fetch error:', fetchError);

        if (fetchError || !existingMessage) {
            console.log('Message not found or fetch error');
            return res.status(404).json({ error: 'Message not found' });
        }

        // Delete the message using service role (bypasses RLS)
        console.log('Attempting to delete message...');
        const { error: deleteError } = await supabase
            .from('admin_messages')
            .delete()
            .eq('id', messageId);

        console.log('Delete error:', deleteError);

        if (deleteError) {
            console.error('Delete error:', deleteError);
            return res.status(500).json({ error: 'Failed to delete message' });
        }

        console.log('Message deleted successfully');
        return res.status(200).json({ success: true, message: 'Message deleted successfully' });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
