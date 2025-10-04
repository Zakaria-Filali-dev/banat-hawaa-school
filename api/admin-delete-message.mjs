import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Enable CORS with stricter origin control in production
    const allowedOrigins = [
        'https://banat-hawaa-school.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
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

    // **CRITICAL SECURITY ENHANCEMENT**: Verify caller is authenticated admin
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
    }

    try {
        // Verify the JWT token and get user info
        const jwt = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid authentication token' });
        }

        // Verify the caller is an admin
        const { data: callerProfile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || !callerProfile || callerProfile.role !== 'admin') {
            // Log suspicious activity
            console.error('[SECURITY] Non-admin attempted message deletion:', {
                callerId: user.id,
                callerEmail: user.email,
                messageId: req.body.messageId,
                timestamp: new Date().toISOString(),
                ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
            });
            return res.status(403).json({ error: 'Forbidden: Admin privileges required' });
        }

        // Log admin action for audit trail
        console.log('[AUDIT] Admin message deletion initiated:', {
            adminId: user.id,
            adminEmail: user.email,
            messageId: req.body.messageId,
            timestamp: new Date().toISOString(),
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
        });

    } catch (error) {
        console.error('[SECURITY] Token verification failed:', error);
        return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
    }

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