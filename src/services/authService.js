import { supabase } from './supabaseClient';
import { useState, useEffect } from 'react';

/**
 * Simple and Reliable Authentication Service
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

        // Initialize auth listener
        this.initializeAuthListener();
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
     * Get current auth state
     */
    getState() {
        return { ...this.authState };
    }

    /**
     * Update auth state immediately
     */
    updateState(updates) {
        console.log('[AuthService] Updating state:', updates);
        this.authState = { ...this.authState, ...updates };
        this.notifySubscribers();
    }

    /**
     * Notify all subscribers of state changes
     */
    notifySubscribers() {
        this.subscribers.forEach(callback => {
            try {
                callback(this.authState);
            } catch (error) {
                console.error('[AuthService] Error notifying subscriber:', error);
            }
        });
    }

    /**
     * Initialize Supabase auth listener
     */
    initializeAuthListener() {
        console.log('[AuthService] Initializing auth listener...');

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log(`[AuthService] Auth event: ${event}`, { sessionExists: !!session });

                try {
                    await this.handleAuthEvent(event, session);
                } catch (error) {
                    console.error('[AuthService] Error handling auth event:', error);
                    this.updateState({
                        error: 'Authentication error occurred',
                        loading: false,
                        initialized: true
                    });
                }
            }
        );

        this.authSubscription = subscription;

        // Initial session check
        this.performInitialCheck();
    }

    /**
     * Handle authentication events
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

            default:
                console.log(`[AuthService] Unhandled auth event: ${event}`);
        }
    }

    /**
     * Handle initial session
     */
    async handleInitialSession(session) {
        console.log('[AuthService] handleInitialSession called with session:', !!session?.user);
        if (session?.user) {
            await this.loadUserProfile(session.user);
        } else {
            console.log('[AuthService] No initial session found');
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
     * Handle sign in
     */
    async handleSignIn(session) {
        console.log('[AuthService] handleSignIn called with session:', !!session?.user);
        if (session?.user) {
            await this.loadUserProfile(session.user);
        }
    }

    /**
     * Handle sign out
     */
    handleSignOut() {
        console.log('[AuthService] handleSignOut called');
        this.updateState({
            user: null,
            profile: null,
            loading: false,
            error: null,
            initialized: true
        });
    }

    /**
     * Handle token refresh
     */
    async handleTokenRefresh(session) {
        console.log('[AuthService] handleTokenRefresh called with session:', !!session?.user);
        if (session?.user) {
            // Just update the user, keep existing profile
            this.updateState({
                user: session.user
            });
        } else {
            // Token refresh failed - sign out
            console.log('[AuthService] Token refresh failed, signing out');
            this.handleSignOut();
        }
    }

    /**
     * Load user profile from database
     */
    async loadUserProfile(user) {
        console.log('[AuthService] Loading profile for user:', user.id);

        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            console.log('[AuthService] Profile query result:', { profile: !!profile, error: !!error });

            if (error) {
                console.error('[AuthService] Profile query error:', error);
                throw error;
            }

            if (profile) {
                console.log('[AuthService] Profile found:', { role: profile.role });
                this.updateState({
                    user,
                    profile,
                    loading: false,
                    error: null,
                    initialized: true
                });
            } else {
                console.log('[AuthService] No profile found');
                throw new Error('Profile not found');
            }
        } catch (error) {
            console.error('[AuthService] Profile loading failed:', error);
            await supabase.auth.signOut();
            this.updateState({
                user: null,
                profile: null,
                loading: false,
                error: 'Profile verification failed. Please contact support.',
                initialized: true
            });
        }
    }

    /**
     * Perform initial session check
     */
    async performInitialCheck() {
        console.log('[AuthService] Performing initial session check...');

        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('[AuthService] Error getting session:', error);
                this.updateState({
                    user: null,
                    profile: null,
                    loading: false,
                    error: 'Session check failed',
                    initialized: true
                });
                return;
            }

            console.log('[AuthService] Initial session check result:', { sessionExists: !!session });

            if (session?.user) {
                await this.loadUserProfile(session.user);
            } else {
                this.updateState({
                    user: null,
                    profile: null,
                    loading: false,
                    error: null,
                    initialized: true
                });
            }
        } catch (error) {
            console.error('[AuthService] Initial check failed:', error);
            this.updateState({
                user: null,
                profile: null,
                loading: false,
                error: 'Authentication check failed',
                initialized: true
            });
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        console.log('[AuthService] signOut called');
        try {
            await supabase.auth.signOut();
            // handleSignOut will be called by the auth state change event
        } catch (error) {
            console.error('[AuthService] Sign out error:', error);
            // Force local state update even if Supabase call fails
            this.handleSignOut();
        }
    }

    /**
     * Refresh current session
     */
    async refreshSession() {
        console.log('[AuthService] refreshSession called');
        try {
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
                console.error('[AuthService] Session refresh error:', error);
            }
            return { data, error };
        } catch (error) {
            console.error('[AuthService] Session refresh failed:', error);
            return { data: null, error };
        }
    }

    /**
     * Check if user has specific role(s)
     */
    hasRole(roles) {
        if (!this.authState.profile?.role) return false;

        if (Array.isArray(roles)) {
            return roles.includes(this.authState.profile.role);
        }

        return this.authState.profile.role === roles;
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.authSubscription) {
            this.authSubscription.unsubscribe();
        }
        this.subscribers.clear();
    }
}

// Export singleton instance
export const authService = new AuthService();

// React hook for using auth service
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