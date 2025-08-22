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

        console.log('=== EMAIL TEST ENDPOINT ===');
        
        // Environment check
        const envStatus = {
            SUPABASE_URL: !!process.env.SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            SUPABASE_URL_VALUE: process.env.SUPABASE_URL ? 'Set' : 'Not Set',
            SUPABASE_KEY_VALUE: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'Not Set'
        };

        console.log('Environment status:', envStatus);

        // Test database connection
        const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select('count(*)')
            .limit(1);

        const dbStatus = {
            connected: !testError,
            error: testError?.message || null
        };

        console.log('Database status:', dbStatus);

        // Test email invitation with a test email
        const testEmail = `test-${Date.now()}@example.com`;
        console.log('Testing email invitation to:', testEmail);

        const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(testEmail, {
            data: {
                full_name: 'Test User',
                role: 'student',
            },
            redirectTo: `https://banat-hawaa-school.vercel.app/login`
        });

        const emailTestResult = {
            success: !inviteError,
            data: inviteData,
            error: inviteError ? {
                message: inviteError.message,
                status: inviteError.status,
                details: inviteError
            } : null
        };

        console.log('Email test result:', emailTestResult);

        // If successful, clean up the test user
        if (inviteData?.user?.id) {
            console.log('Cleaning up test user:', inviteData.user.id);
            await supabase.auth.admin.deleteUser(inviteData.user.id);
        }

        return res.status(200).json({
            message: 'Email System Diagnostic Test',
            environment: envStatus,
            database: dbStatus,
            emailTest: emailTestResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Diagnostic error:', error);
        return res.status(500).json({
            error: 'Diagnostic test failed',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
}
