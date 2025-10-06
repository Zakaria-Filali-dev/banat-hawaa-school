/**
 * Authentication Debugger Utility
 * Helps diagnose authentication timeout and connection issues
 */

import { authUtils } from '../services/supabaseClient';

export const authDebugger = {
    // Test connection speed and reliability
    async testConnection() {
        console.log('🔍 [Auth Debugger] Testing connection...');

        const startTime = Date.now();
        const isConnected = await authUtils.checkConnection();
        const connectionTime = Date.now() - startTime;

        console.log(`🌐 [Auth Debugger] Connection: ${isConnected ? '✅ Online' : '❌ Offline'}`);
        console.log(`⏱️ [Auth Debugger] Connection test took: ${connectionTime}ms`);

        if (connectionTime > 5000) {
            console.warn('⚠️ [Auth Debugger] Slow connection detected (>5s)');
        }

        return { isConnected, connectionTime };
    },

    // Test profile fetch performance
    async testProfileFetch(userId) {
        console.log('👤 [Auth Debugger] Testing profile fetch...');

        const startTime = Date.now();
        try {
            const result = await authUtils.fetchProfileWithTimeout(userId, 10000);
            const fetchTime = Date.now() - startTime;

            console.log(`✅ [Auth Debugger] Profile fetch successful in ${fetchTime}ms`);
            console.log('👤 [Auth Debugger] Profile data:', result.data);

            if (fetchTime > 3000) {
                console.warn('⚠️ [Auth Debugger] Slow profile fetch (>3s)');
            }

            return { success: true, fetchTime, profile: result.data };
        } catch (error) {
            const fetchTime = Date.now() - startTime;
            console.error(`❌ [Auth Debugger] Profile fetch failed after ${fetchTime}ms:`, error.message);
            return { success: false, fetchTime, error: error.message };
        }
    },

    // Comprehensive auth diagnostics
    async runDiagnostics(userId) {
        console.log('🏥 [Auth Debugger] Running comprehensive diagnostics...');

        const diagnostics = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            online: navigator.onLine,
            connection: null,
            profileFetch: null,
            recommendations: []
        };

        // Test connection
        diagnostics.connection = await this.testConnection();

        // Test profile fetch if user ID provided
        if (userId) {
            diagnostics.profileFetch = await this.testProfileFetch(userId);
        }

        // Generate recommendations
        if (!diagnostics.connection.isConnected) {
            diagnostics.recommendations.push('Check internet connection');
        }

        if (diagnostics.connection.connectionTime > 5000) {
            diagnostics.recommendations.push('Connection is slow - consider switching networks');
        }

        if (diagnostics.profileFetch && !diagnostics.profileFetch.success) {
            if (diagnostics.profileFetch.error.includes('timeout')) {
                diagnostics.recommendations.push('Profile fetch timeout - try refreshing the page');
            } else {
                diagnostics.recommendations.push('Profile fetch error - contact support if persistent');
            }
        }

        console.log('📋 [Auth Debugger] Diagnostics complete:', diagnostics);
        return diagnostics;
    },

    // Monitor authentication events
    enableAuthMonitoring() {
        console.log('👁️ [Auth Debugger] Auth monitoring enabled');

        // Monitor network events
        window.addEventListener('online', () => {
            console.log('🌐 [Auth Debugger] Network: ONLINE');
        });

        window.addEventListener('offline', () => {
            console.log('🌐 [Auth Debugger] Network: OFFLINE');
        });

        // Log performance metrics
        if (window.performance && window.performance.getEntriesByType) {
            setInterval(() => {
                const navigationEntries = window.performance.getEntriesByType('navigation');
                if (navigationEntries.length > 0) {
                    const entry = navigationEntries[0];
                    if (entry.loadEventEnd - entry.loadEventStart > 5000) {
                        console.warn('⚠️ [Auth Debugger] Slow page load detected');
                    }
                }
            }, 30000);
        }
    }
};

// Auto-enable in development
if (import.meta.env.DEV) {
    authDebugger.enableAuthMonitoring();
}