// Import with explicit ES module syntax to fix Vite compatibility
import { createClient } from '@supabase/supabase-js';

// Use environment variables for security
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with enterprise-level timeout and reliability configurations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        detectSessionInUrl: true,
        autoRefreshToken: true,
        persistSession: true,
        flowType: 'pkce',
        // Set reasonable timeouts for auth operations
        timeout: 30000, // 30 seconds for auth operations (login/logout)
        retryAttempts: 2 // Retry auth operations twice on failure
    },
    // Database query configurations
    db: {
        schema: 'public'
    },
    // Global configuration with timeout and retry settings
    global: {
        headers: { 'X-Client-Info': 'vite-supabase-client' }
    },
    // Network timeout configurations
    realtime: {
        timeout: 10000, // 10 seconds for realtime connections
        heartbeatIntervalMs: 30000 // Keep connection alive
    }
});

// Enhanced auth utilities with timeout handling
export const authUtils = {
    // Login with timeout protection
    async signInWithTimeout(email, password, timeoutMs = 25000) {
        return new Promise((resolve, reject) => {
            // Set up timeout
            const timeoutId = setTimeout(() => {
                reject(new Error('Login timeout'));
            }, timeoutMs);

            // Execute the login
            supabase.auth.signInWithPassword({
                email,
                password,
            }).then((result) => {
                clearTimeout(timeoutId);
                resolve(result);
            }).catch((error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
    },

    // Profile fetch with timeout protection  
    async fetchProfileWithTimeout(userId, timeoutMs = 15000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Profile fetch timeout'));
            }, timeoutMs);

            // Execute the profile fetch
            supabase
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .single()
                .then((result) => {
                    clearTimeout(timeoutId);
                    resolve(result);
                })
                .catch((error) => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    },

    // Connection status checker
    async checkConnection() {
        try {
            // Quick health check with 5 second timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(supabaseUrl + '/rest/v1/', {
                method: 'HEAD',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch {
            return false;
        }
    }
};
