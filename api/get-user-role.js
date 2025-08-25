// /api/get-user-role.js
// Returns the user's role based on the token_hash from Supabase invite

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: 'Missing token' });
    }

    // Find user by token_hash (invite)
    const { data: users, error } = await supabase
        .from('users')
        .select('id, role, invite_token_hash')
        .eq('invite_token_hash', token)
        .limit(1);

    if (error || !users || users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    return res.status(200).json({ role: user.role });
};
