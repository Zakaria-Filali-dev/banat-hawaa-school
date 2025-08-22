export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Test endpoint to verify API is working
    try {
        console.log('Test API called');
        console.log('Environment check:');
        console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
        console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
        console.log('Request method:', req.method);
        console.log('Request body:', req.body);

        return res.status(200).json({
            success: true,
            message: 'API is working',
            environment: {
                supabaseUrlExists: !!process.env.SUPABASE_URL,
                serviceRoleKeyExists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                nodeEnv: process.env.NODE_ENV || 'not set'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test API error:', error);
        return res.status(500).json({
            error: 'Test API failed',
            details: error.message,
            stack: error.stack
        });
    }
}
