import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email } = req.body;
    try {
        // Find user by email
        const { data: users, error: findError } = await supabase.auth.admin.listUsers({ email });
        if (findError || !users || users.length === 0) {
            throw new Error('User not found');
        }
        const user = users[0];
        // Delete user from auth
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) throw deleteError;
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error in delete-user handler:', err.message || err);
        return res.status(500).json({ error: err.message || 'Unknown error' });
    }
}
