/**
 * 🔐 Security Configuration for School Management System
 * 
 * Centralized configuration for all security-related settings.
 * This file should be carefully reviewed before any changes.
 */

// API Security Settings
export const API_SECURITY = {
    // Allowed origins for CORS (production and development)
    ALLOWED_ORIGINS: [
        'https://banat-hawaa-school.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ],

    // Rate limiting configuration
    RATE_LIMITS: {
        // Critical operations (user deletion, sensitive operations)
        CRITICAL_OPS: {
            maxCalls: 3,
            timeWindow: 60000, // 1 minute
        },

        // Admin actions (general admin operations)
        ADMIN_ACTIONS: {
            maxCalls: 10,
            timeWindow: 60000, // 1 minute
        },

        // API calls (general API usage)
        API_CALLS: {
            maxCalls: 100,
            timeWindow: 60000, // 1 minute
        }
    },

    // Authentication token settings
    AUTH_TOKEN: {
        refreshThreshold: 300000, // 5 minutes before expiry
        maxAge: 3600000, // 1 hour
    }
};

// Role-based access control
export const RBAC = {
    ROLES: {
        ADMIN: 'admin',
        TEACHER: 'teacher',
        STUDENT: 'student'
    },

    // Permissions matrix
    PERMISSIONS: {
        // User management
        DELETE_USER: ['admin'],
        SUSPEND_USER: ['admin'],
        CREATE_USER: ['admin'],
        MANAGE_ROLES: ['admin'],

        // Academic content
        CREATE_SUBJECT: ['admin'],
        ASSIGN_TEACHER: ['admin'],
        MANAGE_ANNOUNCEMENTS: ['admin', 'teacher'],

        // Data access
        VIEW_ALL_USERS: ['admin'],
        VIEW_ALL_SUBJECTS: ['admin', 'teacher'],
        VIEW_OWN_DATA: ['admin', 'teacher', 'student'],

        // Administrative functions  
        MANAGE_APPLICATIONS: ['admin'],
        ACCESS_ADMIN_PANEL: ['admin'],
        SEND_MESSAGES: ['admin', 'teacher'],
    }
};

// Session management
export const SESSION_CONFIG = {
    // Continuous monitoring interval
    MONITORING_INTERVAL: 30000, // 30 seconds

    // Maximum idle time before forced logout
    MAX_IDLE_TIME: 1800000, // 30 minutes

    // Session verification frequency for critical operations
    CRITICAL_OP_VERIFICATION: true,

    // Auto-logout on role change
    LOGOUT_ON_ROLE_CHANGE: true,

    // Security violation handling
    SECURITY_VIOLATIONS: {
        LOG_EVENTS: true,
        NOTIFY_ADMIN: true,
        AUTO_LOGOUT: true
    }
};

// Audit and logging
export const AUDIT_CONFIG = {
    // Events to log
    LOG_EVENTS: [
        'USER_DELETION',
        'ROLE_CHANGE',
        'PERMISSION_VIOLATION',
        'SESSION_VIOLATION',
        'FAILED_AUTH',
        'ADMIN_ACTIONS'
    ],

    // Log levels
    LOG_LEVELS: {
        SECURITY: 'security',
        AUDIT: 'audit',
        ERROR: 'error',
        WARNING: 'warning'
    },

    // Retention policy
    RETENTION_DAYS: 90
};

// Input validation and sanitization
export const VALIDATION_CONFIG = {
    // Maximum request sizes
    MAX_REQUEST_SIZE: {
        FILE_UPLOAD: 10 * 1024 * 1024, // 10MB
        JSON_BODY: 1 * 1024 * 1024,    // 1MB
        TEXT_FIELD: 10000 // 10k characters
    },

    // Allowed file types
    ALLOWED_FILE_TYPES: [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],

    // Content security
    SANITIZATION: {
        STRIP_HTML: true,
        ESCAPE_SQL: true,
        VALIDATE_URLS: true
    }
};

// Error handling and disclosure
export const ERROR_CONFIG = {
    // What to show to users vs log internally
    USER_ERROR_MESSAGES: {
        AUTH_FAILED: 'Authentication failed. Please log in again.',
        PERMISSION_DENIED: 'You do not have permission to perform this action.',
        RATE_LIMITED: 'Too many requests. Please wait before trying again.',
        VALIDATION_ERROR: 'Invalid input provided.',
        SERVER_ERROR: 'A system error occurred. Please contact support if this persists.'
    },

    // Internal error logging
    LOG_SENSITIVE_ERRORS: false, // Don't log sensitive data
    INCLUDE_STACK_TRACES: import.meta.env?.MODE === 'development'
};

// Security headers and policies
export const SECURITY_HEADERS = {
    // Content Security Policy
    CSP: {
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline' https://cdn.supabase.co",
        'style-src': "'self' 'unsafe-inline'",
        'img-src': "'self' data: https:",
        'connect-src': "'self' https://*.supabase.co wss://*.supabase.co",
        'frame-ancestors': "'none'"
    },

    // Additional security headers
    ADDITIONAL: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
};

// Export all configurations
export default {
    API_SECURITY,
    RBAC,
    SESSION_CONFIG,
    AUDIT_CONFIG,
    VALIDATION_CONFIG,
    ERROR_CONFIG,
    SECURITY_HEADERS
};