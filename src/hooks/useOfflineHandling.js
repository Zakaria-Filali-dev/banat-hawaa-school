import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for detecting online/offline status and handling network events
 */
export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);
    const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());

    const handleOnline = useCallback(() => {
        setIsOnline(true);
        if (wasOffline) {
            setWasOffline(false);
            console.log('🌐 Connection restored at', new Date().toLocaleTimeString());
        }
        setLastOnlineTime(Date.now());
    }, [wasOffline]);

    const handleOffline = useCallback(() => {
        setIsOnline(false);
        setWasOffline(true);
        console.log('📴 Connection lost at', new Date().toLocaleTimeString());
    }, []);

    useEffect(() => {
        // Set initial state
        setIsOnline(navigator.onLine);

        // Add event listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup listeners
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [handleOnline, handleOffline]);

    return {
        isOnline,
        wasOffline,
        lastOnlineTime,
        timeSinceLastOnline: isOnline ? 0 : Date.now() - lastOnlineTime
    };
};

/**
 * Custom hook for retry logic with exponential backoff
 */
export const useRetryLogic = (maxRetries = 3, baseDelay = 1000) => {
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);

    const executeWithRetry = useCallback(async (asyncFunction) => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                setRetryCount(attempt);
                if (attempt > 0) {
                    setIsRetrying(true);
                    const delay = baseDelay * Math.pow(2, attempt - 1);
                    console.log(`⏳ Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries + 1})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                const result = await asyncFunction();
                setIsRetrying(false);
                setRetryCount(0);
                return result;
            } catch (error) {
                console.warn(`❌ Attempt ${attempt + 1} failed:`, error.message);

                if (attempt === maxRetries) {
                    setIsRetrying(false);
                    throw new Error(`Failed after ${maxRetries + 1} attempts: ${error.message}`);
                }
            }
        }
    }, [maxRetries, baseDelay]);

    const resetRetry = useCallback(() => {
        setRetryCount(0);
        setIsRetrying(false);
    }, []);

    return {
        executeWithRetry,
        retryCount,
        isRetrying,
        resetRetry
    };
};

/**
 * Custom hook for offline queue management
 */
export const useOfflineQueue = () => {
    const [queue, setQueue] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const { isOnline } = useNetworkStatus();
    const { executeWithRetry } = useRetryLogic();

    // Add operation to queue
    const addToQueue = useCallback((operation, metadata = {}) => {
        const queueItem = {
            id: Date.now() + Math.random(),
            operation,
            metadata: {
                timestamp: Date.now(),
                ...metadata
            }
        };

        setQueue(prev => [...prev, queueItem]);
        return queueItem.id;
    }, []);

    // Remove operation from queue
    const removeFromQueue = useCallback((id) => {
        setQueue(prev => prev.filter(item => item.id !== id));
    }, []);

    // Process queued operations when online
    const processQueue = useCallback(async () => {
        if (!isOnline || isProcessing || queue.length === 0) {
            return;
        }

        setIsProcessing(true);
        console.log(`📤 Processing ${queue.length} offline operations...`);

        const results = [];

        for (const item of queue) {
            try {
                const result = await executeWithRetry(item.operation);
                results.push({ id: item.id, success: true, result });
                removeFromQueue(item.id);
                console.log(`✅ Processed queued operation:`, item.metadata);
            } catch (error) {
                console.error(`❌ Failed to process queued operation:`, error);
                results.push({ id: item.id, success: false, error });
                // Keep failed items in queue for manual retry
            }
        }

        setIsProcessing(false);
        return results;
    }, [isOnline, isProcessing, queue, executeWithRetry, removeFromQueue]);

    // Auto-process queue when coming online
    useEffect(() => {
        if (isOnline && queue.length > 0) {
            processQueue();
        }
    }, [isOnline, queue.length, processQueue]);

    return {
        queue,
        addToQueue,
        removeFromQueue,
        processQueue,
        isProcessing,
        queueSize: queue.length
    };
};

/**
 * Hook for caching data for offline use
 */
export const useOfflineCache = (key, ttl = 24 * 60 * 60 * 1000) => { // 24 hours default
    const getFromCache = useCallback(() => {
        try {
            const cached = localStorage.getItem(`offline_cache_${key}`);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            const isExpired = Date.now() - timestamp > ttl;

            if (isExpired) {
                localStorage.removeItem(`offline_cache_${key}`);
                return null;
            }

            return data;
        } catch (error) {
            console.warn('Failed to read from offline cache:', error);
            return null;
        }
    }, [key, ttl]);

    const setToCache = useCallback((data) => {
        try {
            const cacheItem = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(`offline_cache_${key}`, JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('Failed to write to offline cache:', error);
        }
    }, [key]);

    const clearCache = useCallback(() => {
        localStorage.removeItem(`offline_cache_${key}`);
    }, [key]);

    return {
        getFromCache,
        setToCache,
        clearCache
    };
};

export default {
    useNetworkStatus,
    useRetryLogic,
    useOfflineQueue,
    useOfflineCache
};