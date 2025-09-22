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

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Missing Supabase environment variables' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Missing token or password' });
    }

    try {
        // Use verifyOtp to verify the invite token and update password
        const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'invite'
        });

        if (error) {
            console.error('Token verification error:', error);
            return res.status(400).json({ error: error.message || 'Invalid or expired invitation token' });
        }

        if (!data.user) {
            return res.status(400).json({ error: 'No user found with this invitation token' });
        }

        // Now update the user's password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            data.user.id,
            {
                password: password,
                email_confirm: true
            }
        );

        if (updateError) {
            console.error('Password update error:', updateError);
            return res.status(400).json({ error: updateError.message || 'Failed to update password' });
        }

        return res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (err) {
        console.error('Setup password error:', err);
        return res.status(500).json({
            error: 'Internal server error while setting up password'
        });
    }
}