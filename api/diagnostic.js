import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        console.log('=== DIAGNOSTIC TEST ===');

        // Test environment variables
        const envCheck = {
            SUPABASE_URL: !!process.env.SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            BREVO_SMTP_SERVER: !!process.env.BREVO_SMTP_SERVER,
            BREVO_SMTP_PORT: !!process.env.BREVO_SMTP_PORT,
            BREVO_SMTP_USER: !!process.env.BREVO_SMTP_USER,
            BREVO_SMTP_PASS: !!process.env.BREVO_SMTP_PASS,
        };

        // Test Supabase connection
        const { error: testError } = await supabase
            .from('profiles')
            .select('count(*)')
            .limit(1);

        const connectionTest = {
            success: !testError,
            error: testError?.message || null
        };

        // Test creating a simple user without email invitation first
        console.log('Testing basic user creation without email...');
        const testEmail = `test-${Date.now()}@example.com`;

        let authTestResult = null;
        try {
            // Try basic auth admin create (no email)
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: testEmail,
                email_confirm: true, // Skip email confirmation
                user_metadata: {
                    full_name: 'Test User',
                    role: 'student'
                }
            });

            if (authError) {
                authTestResult = { success: false, error: authError.message };
            } else {
                authTestResult = { success: true, userId: authData?.user?.id };

                // Clean up test user
                await supabase.auth.admin.deleteUser(authData.user.id);
            }
        } catch (err) {
            authTestResult = { success: false, error: err.message };
        }

        return res.status(200).json({
            message: 'Diagnostic Test Results',
            environment: envCheck,
            supabaseConnection: connectionTest,
            authTest: authTestResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Diagnostic error:', error);
        return res.status(500).json({
            error: 'Diagnostic test failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
