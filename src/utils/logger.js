// Enhanced logger utility for production safety
const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};

class Logger {
    constructor() {
        this.isDevelopment = import.meta.env.DEV;
    }

    error(message, ...args) {
        // ✅ Always log errors, even in production
        console.error(`🚨 [ERROR]`, message, ...args);
    }

    warn(message, ...args) {
        // ✅ Always log warnings
        console.warn(`⚠️ [WARN]`, message, ...args);
    }

    info(message, ...args) {
        // ⚡ Only log info in development
        if (this.isDevelopment) {
            console.info(`ℹ️ [INFO]`, message, ...args);
        }
    }

    debug(message, ...args) {
        // 🔍 Only log debug in development
        if (this.isDevelopment) {
            console.log(`🐛 [DEBUG]`, message, ...args);
        }
    }

    // 📊 Performance monitoring (safe for production)
    time(label) {
        if (this.isDevelopment) {
            console.time(label);
        }
    }

    timeEnd(label) {
        if (this.isDevelopment) {
            console.timeEnd(label);
        }
    }
}

export const logger = new Logger();