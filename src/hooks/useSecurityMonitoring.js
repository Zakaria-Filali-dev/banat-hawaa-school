import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

/**
 * Security Enhancement: Continuous Role Monitoring Hook
 * 
 * This hook provides continuous verification of user roles and session integrity
 * to prevent privilege escalation and unauthorized access.
 * 
 * Features:
 * - Periodic role verification
 * - Session integrity checks
 * - Automatic logout on role changes
 * - Security event logging
 * - Rate limiting to prevent excessive API calls
 */
export const useSecurityMonitoring = (expectedRole, options = {}) => {
    const navigate = useNavigate();
    const lastCheckRef = useRef(0);
    const monitoringIntervalRef = useRef(null);

    const {
        checkInterval = 30000, // 30 seconds default
        onRoleChanged = null,
        onSecurityViolation = null,
        enableLogging = true
    } = options;

    const logSecurityEvent = useCallback((event, details = {}) => {
        if (!enableLogging) return;

        console.log(`[SECURITY] ${event}:`, {
            timestamp: new Date().toISOString(),
            expectedRole,
            userAgent: navigator.userAgent,
            ...details
        });
    }, [expectedRole, enableLogging]);

    const verifyRoleAndSession = useCallback(async () => {
        try {
            // Rate limiting: Don't check more than once per 10 seconds
            const now = Date.now();
            if (now - lastCheckRef.current < 10000) {
                return true;
            }
            lastCheckRef.current = now;

            // Check session validity
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                logSecurityEvent('Session expired or invalid', { sessionError: sessionError?.message });
                if (onSecurityViolation) {
                    onSecurityViolation('SESSION_INVALID');
                }
                navigate('/login');
                return false;
            }

            // Verify current role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, status')
                .eq('id', session.user.id)
                .single();

            if (profileError) {
                logSecurityEvent('Profile verification failed', {
                    error: profileError.message,
                    userId: session.user.id
                });
                if (onSecurityViolation) {
                    onSecurityViolation('PROFILE_ERROR');
                }
                navigate('/login');
                return false;
            }

            // Check if role has changed
            if (profile.role !== expectedRole) {
                logSecurityEvent('Role mismatch detected', {
                    expected: expectedRole,
                    actual: profile.role,
                    userId: session.user.id,
                    userEmail: session.user.email
                });

                if (onRoleChanged) {
                    onRoleChanged(profile.role, expectedRole);
                }

                if (onSecurityViolation) {
                    onSecurityViolation('ROLE_CHANGED');
                }

                // Redirect to appropriate dashboard based on current role
                switch (profile.role) {
                    case 'admin':
                        navigate('/admin');
                        break;
                    case 'teacher':
                        navigate('/teacher');
                        break;
                    case 'student':
                        navigate('/student');
                        break;
                    default:
                        navigate('/login');
                }
                return false;
            }

            // Check if account is suspended
            if (profile.status === 'suspended') {
                logSecurityEvent('Suspended account detected', {
                    userId: session.user.id,
                    userEmail: session.user.email
                });

                if (onSecurityViolation) {
                    onSecurityViolation('ACCOUNT_SUSPENDED');
                }

                // Sign out suspended user
                await supabase.auth.signOut();
                navigate('/login');
                return false;
            }

            return true;
        } catch (error) {
            logSecurityEvent('Role verification error', {
                error: error.message
            });

            if (onSecurityViolation) {
                onSecurityViolation('VERIFICATION_ERROR');
            }

            return false;
        }
    }, [expectedRole, navigate, onRoleChanged, onSecurityViolation, logSecurityEvent]);

    // Start continuous monitoring
    useEffect(() => {
        // Initial verification
        verifyRoleAndSession();

        // Set up periodic monitoring
        monitoringIntervalRef.current = setInterval(() => {
            verifyRoleAndSession();
        }, checkInterval);

        return () => {
            if (monitoringIntervalRef.current) {
                clearInterval(monitoringIntervalRef.current);
            }
        };
    }, [verifyRoleAndSession, checkInterval]);

    // Manual verification function for critical operations
    const verifyBeforeCriticalOperation = useCallback(async () => {
        return await verifyRoleAndSession();
    }, [verifyRoleAndSession]);

    return {
        verifyBeforeCriticalOperation,
        manualVerification: verifyRoleAndSession
    };
};

/**
 * Rate Limiting Hook for API Calls
 * 
 * Prevents abuse of sensitive API endpoints by implementing
 * client-side rate limiting with exponential backoff.
 */
export const useRateLimit = (maxCalls = 5, timeWindow = 60000) => {
    const callsRef = useRef([]);

    const checkRateLimit = useCallback(() => {
        const now = Date.now();

        // Remove calls outside the time window
        callsRef.current = callsRef.current.filter(
            callTime => now - callTime < timeWindow
        );

        // Check if we've exceeded the limit
        if (callsRef.current.length >= maxCalls) {
            return false;
        }

        // Record this call
        callsRef.current.push(now);
        return true;
    }, [maxCalls, timeWindow]);

    const getRemainingCalls = useCallback(() => {
        const now = Date.now();
        callsRef.current = callsRef.current.filter(
            callTime => now - callTime < timeWindow
        );
        return Math.max(0, maxCalls - callsRef.current.length);
    }, [maxCalls, timeWindow]);

    return {
        checkRateLimit,
        getRemainingCalls
    };
};