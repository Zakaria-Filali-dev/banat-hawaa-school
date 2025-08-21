// Import with explicit ES module syntax to fix Vite compatibility
import { createClient } from '@supabase/supabase-js';

// Use environment variables for security
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with explicit options for Vite compatibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        detectSessionInUrl: true,
        autoRefreshToken: true,
        persistSession: true,
        flowType: 'pkce'
    },
    // Add global configuration to prevent module loading issues
    global: {
        headers: { 'X-Client-Info': 'vite-supabase-client' }
    }
});
