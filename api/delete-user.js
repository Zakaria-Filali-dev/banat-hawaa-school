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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Initialize Supabase client
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { email } = req.body;

    try {
        console.log('Deleting user with email:', email);

        // Find user by email
        const { data: users, error: findError } = await supabase.auth.admin.listUsers();
        if (findError) throw findError;

        const user = users.users.find(u => u.email === email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete from profiles table first
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);

        if (profileError) {
            console.error('Error deleting profile:', profileError);
        }

        // Delete from auth
        const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
        if (authError) throw authError;

        console.log('User deleted successfully');
        return res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({
            error: err.message || 'Unknown error',
            details: err
        });
    }
}
