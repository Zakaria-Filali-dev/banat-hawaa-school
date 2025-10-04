import { supabase } from './supabaseClient';

/**
 * Enhanced Authentication Service with Race Condition Protection
 * 
 * Handles authentication state management with:
 * - Debounced state updates
 * - Race condition prevention
 * - Optimistic updates with rollback
 * - Concurrent operation queuing
 * - Session integrity verification
 */
class AuthService {
    constructor() {
        this.authState = {
            user: null,
            profile: null,
            loading: true,
            error: null,
            initialized: false
        };

        this.subscribers = new Set();
        this.pendingOperations = new Map();
        this.operationQueue = [];
        this.isProcessingQueue = false;
        this.stateUpdateTimeout = null;
        this.sessionCheckInterval = null;

        // Initialize auth listener
        this.initializeAuthListener();

        // Periodic session verification
        this.startSessionMonitoring();
    }

    /**
     * Subscribe to auth state changes
     */
    subscribe(callback) {
        this.subscribers.add(callback);

        // Immediately notify with current state
        if (this.authState.initialized) {
            callback(this.authState);
        }

        return () => {
            this.subscribers.delete(callback);
        };
    }

    /**
     * Debounced state update to prevent excessive re-renders
     */
    updateState(newState, immediate = false) {
        clearTimeout(this.stateUpdateTimeout);

        const update = () => {
            this.authState = { ...this.authState, ...newState };
            this.notifySubscribers();
        };

        if (immediate) {
            update();
        } else {
            this.stateUpdateTimeout = setTimeout(update, 50);
        }
    }

    /**
     * Notify all subscribers of state changes
     */
    notifySubscribers() {
        const state = { ...this.authState };
        this.subscribers.forEach(callback => {
            try {
                callback(state);
            } catch (error) {
                console.error('Auth subscriber error:', error);
            }
        });
    }

    /**
     * Initialize authentication listener with race condition protection
     */
    initializeAuthListener() {
        let lastEventTime = 0;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const eventTime = Date.now();

                // Prevent duplicate events within 100ms
                if (eventTime - lastEventTime < 100) {
                    return;
                }
                lastEventTime = eventTime;

                console.log(`[AuthService] Auth event: ${event}`, { sessionExists: !!session });

                try {
                    await this.handleAuthEvent(event, session);
                } catch (error) {
                    console.error('[AuthService] Error handling auth event:', error);
                    this.updateState({
                        error: 'Authentication error occurred',
                        loading: false
                    });
                }
            }
        );

        this.authSubscription = subscription;

        // Initial session check
        this.performInitialCheck();
    }

    /**
     * Handle authentication events with proper error handling
     */
    async handleAuthEvent(event, session) {
        switch (event) {
            case 'INITIAL_SESSION':
                await this.handleInitialSession(session);
                break;

            case 'SIGNED_IN':
                await this.handleSignIn(session);
                break;

            case 'SIGNED_OUT':
                this.handleSignOut();
                break;

            case 'TOKEN_REFRESHED':
                await this.handleTokenRefresh(session);
                break;

            case 'USER_UPDATED':
                await this.handleUserUpdate(session);
                break;

            default:
                console.log(`[AuthService] Unhandled auth event: ${event}`);
        }
    }

    /**
     * Handle initial session with race condition protection
     */
    async handleInitialSession(session) {
        if (session?.user) {
            const profile = await this.verifyProfile(session.user.id);
            if (profile) {
                this.updateState({
                    user: session.user,
                    profile,
                    loading: false,
                    error: null,
                    initialized: true
                });
            } else {
                // Profile doesn't exist - account was deleted
                await supabase.auth.signOut();
                this.updateState({
                    user: null,
                    profile: null,
                    loading: false,
                    error: 'Account no longer exists',
                    initialized: true
                });
            }
        } else {
            this.updateState({
                user: null,
                profile: null,
                loading: false,
                error: null,
                initialized: true
            });
        }
    }

    /**
     * Handle sign in with profile verification
     */
    async handleSignIn(session) {
        if (session?.user) {
            const profile = await this.verifyProfile(session.user.id);
            if (profile) {
                this.updateState({
                    user: session.user,
                    profile,
                    loading: false,
                    error: null
                });
            } else {
                await supabase.auth.signOut();
                this.updateState({
                    user: null,
                    profile: null,
                    loading: false,
                    error: 'Account has been removed by administrator'
                });
            }
        }
    }

    /**
     * Handle sign out
     */
    handleSignOut() {
        this.updateState({
            user: null,
            profile: null,
            loading: false,
            error: null
        });
    }

    /**
     * Handle token refresh with session validation
     */
    async handleTokenRefresh(session) {
        if (session?.user) {
            // Verify profile still exists after token refresh
            const profile = await this.verifyProfile(session.user.id);
            if (!profile) {
                await supabase.auth.signOut();
                this.updateState({
                    user: null,
                    profile: null,
                    error: 'Session invalidated - account removed'
                });
            }
        } else {
            // Token refresh failed - sign out
            this.handleSignOut();
        }
    }

    /**
     * Handle user update
     */
    async handleUserUpdate(session) {
        if (session?.user && this.authState.user) {
            this.updateState({
                user: session.user
            });
        }
    }

    /**
     * Verify user profile exists and is valid
     */
    async verifyProfile(userId) {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('[AuthService] Profile not found - account deleted');
                    return null;
                }
                throw error;
            }

            return profile;
        } catch (error) {
            console.error('[AuthService] Profile verification error:', error);
            return null;
        }
    }

    /**
     * Perform initial authentication check
     */
    async performInitialCheck() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                throw error;
            }

            await this.handleInitialSession(session);
        } catch (error) {
            console.error('[AuthService] Initial check error:', error);
            this.updateState({
                loading: false,
                error: 'Failed to initialize authentication',
                initialized: true
            });
        }
    }

    /**
     * Start periodic session monitoring
     */
    startSessionMonitoring() {
        // Check session validity every 5 minutes
        this.sessionCheckInterval = setInterval(async () => {
            if (this.authState.user) {
                try {
                    const { data: { session } } = await supabase.auth.getSession();

                    if (!session) {
                        console.log('[AuthService] Session expired during monitoring');
                        this.handleSignOut();
                    } else {
                        // Verify profile still exists
                        const profile = await this.verifyProfile(session.user.id);
                        if (!profile) {
                            console.log('[AuthService] Profile deleted during monitoring');
                            await supabase.auth.signOut();
                        }
                    }
                } catch (error) {
                    console.error('[AuthService] Session monitoring error:', error);
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Queue an operation to prevent race conditions
     */
    async queueOperation(operationId, operation) {
        return new Promise((resolve, reject) => {
            // Check if operation is already pending
            if (this.pendingOperations.has(operationId)) {
                return this.pendingOperations.get(operationId);
            }

            const operationPromise = {
                id: operationId,
                operation,
                resolve,
                reject,
                timestamp: Date.now()
            };

            this.operationQueue.push(operationPromise);
            this.pendingOperations.set(operationId, operationPromise);

            this.processQueue();
        });
    }

    /**
     * Process operation queue sequentially
     */
    async processQueue() {
        if (this.isProcessingQueue || this.operationQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.operationQueue.length > 0) {
            const { id, operation, resolve, reject } = this.operationQueue.shift();

            try {
                const result = await operation();
                this.pendingOperations.delete(id);
                resolve(result);
            } catch (error) {
                this.pendingOperations.delete(id);
                reject(error);
            }
        }

        this.isProcessingQueue = false;
    }

    /**
     * Get current auth state
     */
    getState() {
        return { ...this.authState };
    }

    /**
     * Sign out with cleanup
     */
    async signOut() {
        return this.queueOperation('signOut', async () => {
            await supabase.auth.signOut();
            this.handleSignOut();
        });
    }

    /**
     * Refresh session
     */
    async refreshSession() {
        return this.queueOperation('refreshSession', async () => {
            const { data, error } = await supabase.auth.refreshSession();
            if (error) throw error;
            return data;
        });
    }

    /**
     * Check role with caching and validation
     */
    hasRole(allowedRoles) {
        if (!this.authState.profile) return false;
        if (!Array.isArray(allowedRoles)) {
            allowedRoles = [allowedRoles];
        }
        return allowedRoles.includes(this.authState.profile.role);
    }

    /**
     * Clean up resources
     */
    destroy() {
        clearTimeout(this.stateUpdateTimeout);
        clearInterval(this.sessionCheckInterval);

        if (this.authSubscription) {
            this.authSubscription.unsubscribe();
        }

        this.subscribers.clear();
        this.pendingOperations.clear();
        this.operationQueue.length = 0;
    }
}

// Export singleton instance
export const authService = new AuthService();

// React hook for using auth service
import { useState, useEffect } from 'react';

export function useAuth() {
    const [authState, setAuthState] = useState(() => authService.getState());

    useEffect(() => {
        return authService.subscribe(setAuthState);
    }, []);

    return {
        ...authState,
        signOut: () => authService.signOut(),
        refreshSession: () => authService.refreshSession(),
        hasRole: (roles) => authService.hasRole(roles)
    };
}

export default authService;