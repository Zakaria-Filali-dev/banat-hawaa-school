import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { messageId } = req.body;

    if (!messageId) {
        return res.status(400).json({ error: 'Message ID is required' });
    }

    try {
        console.log('Deleting message with ID:', messageId);

        // First, check if the message exists
        const { data: existingMessage, error: fetchError } = await supabase
            .from('admin_messages')
            .select('id, subject')
            .eq('id', messageId)
            .single();

        if (fetchError || !existingMessage) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Delete the message from the database
        const { error: deleteError } = await supabase
            .from('admin_messages')
            .delete()
            .eq('id', messageId);

        if (deleteError) {
            console.error('Error deleting message:', deleteError);
            return res.status(500).json({ 
                error: 'Failed to delete message: ' + deleteError.message 
            });
        }

        console.log('Message deleted successfully:', existingMessage.subject);

        return res.status(200).json({ 
            success: true, 
            message: 'Message deleted successfully',
            deletedMessage: existingMessage 
        });

    } catch (err) {
        console.error('Unexpected error during message deletion:', err);
        return res.status(500).json({ 
            error: 'Internal server error while deleting message' 
        });
    }
}