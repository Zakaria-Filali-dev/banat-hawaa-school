import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for safe timeouts that automatically clear on unmount
 */
export const useSafeTimeout = () => {
    const timeoutsRef = useRef(new Set());

    const setSafeTimeout = (callback, delay) => {
        const timeoutId = setTimeout(() => {
            timeoutsRef.current.delete(timeoutId);
            callback();
        }, delay);

        timeoutsRef.current.add(timeoutId);
        return timeoutId;
    };

    const clearSafeTimeout = (timeoutId) => {
        clearTimeout(timeoutId);
        timeoutsRef.current.delete(timeoutId);
    };

    const clearAllTimeouts = () => {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current.clear();
    };

    useEffect(() => {
        return clearAllTimeouts;
    }, []);

    return { setSafeTimeout, clearSafeTimeout, clearAllTimeouts };
};

/**
 * Custom hook for safe intervals that automatically clear on unmount
 */
export const useSafeInterval = () => {
    const intervalsRef = useRef(new Set());

    const setSafeInterval = (callback, delay) => {
        const intervalId = setInterval(() => {
            callback();
        }, delay);

        intervalsRef.current.add(intervalId);
        return intervalId;
    };

    const clearSafeInterval = (intervalId) => {
        clearInterval(intervalId);
        intervalsRef.current.delete(intervalId);
    };

    const clearAllIntervals = () => {
        intervalsRef.current.forEach(clearInterval);
        intervalsRef.current.clear();
    };

    useEffect(() => {
        return clearAllIntervals;
    }, []);

    return { setSafeInterval, clearSafeInterval, clearAllIntervals };
};

/**
 * Custom hook for safe async operations with abort controller
 */
export const useSafeAsync = () => {
    const abortControllersRef = useRef(new Set());

    const createSafeAsyncOperation = (asyncFunction) => {
        const abortController = new AbortController();
        abortControllersRef.current.add(abortController);

        const safeAsyncFunction = async (...args) => {
            try {
                const result = await asyncFunction(abortController.signal, ...args);
                abortControllersRef.current.delete(abortController);
                return result;
            } catch (error) {
                abortControllersRef.current.delete(abortController);
                if (error.name === 'AbortError') {
                    console.log('Async operation was cancelled');
                    return null;
                }
                throw error;
            }
        };

        return safeAsyncFunction;
    };

    const abortAllOperations = () => {
        abortControllersRef.current.forEach(controller => {
            try {
                controller.abort();
            } catch (error) {
                console.warn('Error aborting async operation:', error);
            }
        });
        abortControllersRef.current.clear();
    };

    useEffect(() => {
        return abortAllOperations;
    }, []);

    return { createSafeAsyncOperation, abortAllOperations };
};

/**
 * Custom hook for debounced functions with cleanup
 */
export const useDebouncedCallback = (callback, delay) => {
    const { setSafeTimeout, clearSafeTimeout } = useSafeTimeout();
    const timeoutRef = useRef();

    const debouncedCallback = (...args) => {
        if (timeoutRef.current) {
            clearSafeTimeout(timeoutRef.current);
        }

        timeoutRef.current = setSafeTimeout(() => {
            callback(...args);
            timeoutRef.current = null;
        }, delay);
    };

    return debouncedCallback;
};

/**
 * Custom hook for event listeners with automatic cleanup
 */
export const useSafeEventListener = (target, event, handler, options = {}) => {
    useEffect(() => {
        if (!target) return;

        const element = target.current || target;
        if (!element || typeof element.addEventListener !== 'function') return;

        element.addEventListener(event, handler, options);

        return () => {
            element.removeEventListener(event, handler, options);
        };
    }, [target, event, handler, options]);
};

/**
 * Custom hook to track component mount status
 */
export const useIsMounted = () => {
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return isMountedRef;
};

/**
 * Higher-order function to make state setters safe for unmounted components
 */
export const makeSafeStateUpdater = (setState, isMountedRef) => {
    return (value) => {
        if (isMountedRef.current) {
            setState(value);
        }
    };
};

/**
 * Hook to create safe state updaters for all state setters
 */
export const useSafeState = (initialState) => {
    const [state, setState] = useState(initialState);
    const isMountedRef = useIsMounted();

    const safeSetState = makeSafeStateUpdater(setState, isMountedRef);

    return [state, safeSetState, isMountedRef];
};

export default {
    useSafeTimeout,
    useSafeInterval,
    useSafeAsync,
    useDebouncedCallback,
    useSafeEventListener,
    useIsMounted,
    makeSafeStateUpdater,
    useSafeState
};