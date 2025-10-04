import { useState, useEffect, useRef, useCallback } from 'react';
import { operationQueue } from './operationQueue';

/**
 * Enhanced State Management Hook with Race Condition Protection
 * 
 * Provides:
 * - Debounced state updates
 * - Optimistic updates with rollback
 * - Operation queuing for related resources
 * - Automatic cleanup on unmount
 * - State synchronization across components
 */
export function useProtectedState(
    initialState,
    resourceType = 'default',
    resourceId = 'global',
    options = {}
) {
    const {
        debounceMs = 100,
        enableOptimistic = true,
        onStateChange = null
    } = options;

    const [state, setState] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isMountedRef = useRef(true);
    const debounceTimeoutRef = useRef(null);
    const pendingUpdatesRef = useRef([]);
    const lastStateRef = useRef(initialState);
    const syncSubscriptionRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => {
        const cleanup = syncSubscriptionRef.current;

        return () => {
            isMountedRef.current = false;
            clearTimeout(debounceTimeoutRef.current);

            if (cleanup) {
                cleanup();
            }

            // Cancel any pending operations for this resource
            operationQueue.cancelResourceOperations(resourceType, resourceId);
        };
    }, [resourceType, resourceId]);

    /**
     * Safe setState that checks if component is still mounted
     */
    const safeSetState = useCallback((newState) => {
        if (!isMountedRef.current) return;

        const updatedState = typeof newState === 'function' ? newState(lastStateRef.current) : newState;
        lastStateRef.current = updatedState;
        setState(updatedState);

        if (onStateChange) {
            onStateChange(updatedState);
        }
    }, [onStateChange]);

    /**
     * Debounced state update to prevent excessive re-renders
     */
    const updateStateDebounced = useCallback((update) => {
        pendingUpdatesRef.current.push(update);

        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = setTimeout(() => {
            if (!isMountedRef.current) return;

            const updates = [...pendingUpdatesRef.current];
            pendingUpdatesRef.current = [];

            let newState = lastStateRef.current;

            updates.forEach(update => {
                if (typeof update === 'function') {
                    newState = update(newState);
                } else {
                    newState = { ...newState, ...update };
                }
            });

            safeSetState(newState);
        }, debounceMs);
    }, [debounceMs, safeSetState]);

    /**
     * Perform an optimistic update with operation queuing
     */
    const performOptimisticUpdate = useCallback(async (
        optimisticUpdate,
        operation,
        options = {}
    ) => {
        const {
            rollbackOnError = true,
            priority = 'normal',
            timeout = 30000
        } = options;

        if (!isMountedRef.current) return;

        // Store current state for potential rollback
        const previousState = lastStateRef.current;

        // Apply optimistic update immediately
        if (enableOptimistic && optimisticUpdate) {
            safeSetState(currentState => {
                const newState = typeof optimisticUpdate === 'function'
                    ? optimisticUpdate(currentState)
                    : { ...currentState, ...optimisticUpdate };
                return newState;
            });
        }

        setLoading(true);
        setError(null);

        try {
            // Queue the actual operation
            const result = await operationQueue.queueOperation(
                resourceType,
                resourceId,
                operation,
                {
                    priority,
                    timeout,
                    optimistic: enableOptimistic,
                    rollbackData: rollbackOnError ? {
                        rollback: () => {
                            if (isMountedRef.current) {
                                safeSetState(previousState);
                            }
                        }
                    } : null
                }
            );

            if (!isMountedRef.current) return result;

            // Update state with actual result if provided
            if (result && typeof result === 'object' && result.state) {
                safeSetState(result.state);
            }

            setLoading(false);
            return result;

        } catch (operationError) {
            if (!isMountedRef.current) return;

            console.error(`[useProtectedState] Operation failed for ${resourceType}:${resourceId}`, operationError);

            // Rollback optimistic update if enabled
            if (enableOptimistic && rollbackOnError) {
                safeSetState(previousState);
            }

            setError(operationError.message || 'Operation failed');
            setLoading(false);

            throw operationError;
        }
    }, [resourceType, resourceId, enableOptimistic, safeSetState]);

    /**
     * Batch multiple state updates
     */
    const batchUpdate = useCallback((updates) => {
        if (!Array.isArray(updates)) {
            updates = [updates];
        }

        const batchedUpdate = (currentState) => {
            let newState = currentState;

            updates.forEach(update => {
                if (typeof update === 'function') {
                    newState = update(newState);
                } else {
                    newState = { ...newState, ...update };
                }
            });

            return newState;
        };

        updateStateDebounced(batchedUpdate);
    }, [updateStateDebounced]);

    /**
     * Reset state to initial value
     */
    const resetState = useCallback(() => {
        safeSetState(initialState);
        setError(null);
        setLoading(false);
    }, [initialState, safeSetState]);

    /**
     * Force immediate state update (bypasses debouncing)
     */
    const forceUpdate = useCallback((update) => {
        clearTimeout(debounceTimeoutRef.current);
        pendingUpdatesRef.current = [];

        const newState = typeof update === 'function' ? update(lastStateRef.current) : update;
        safeSetState(newState);
    }, [safeSetState]);

    /**
     * Get current operation queue status
     */
    const getQueueStatus = useCallback(() => {
        return operationQueue.getOperationStatus(`${resourceType}_${resourceId}`);
    }, [resourceType, resourceId]);

    return {
        state,
        loading,
        error,
        updateState: updateStateDebounced,
        performOptimisticUpdate,
        batchUpdate,
        forceUpdate,
        resetState,
        getQueueStatus,
        isMounted: () => isMountedRef.current
    };
}

/**
 * Hook for managing CRUD operations with race condition protection
 */
export function useCRUDOperations(resourceType, options = {}) {
    const {
        onSuccess = null,
        onError = null,
        enableOptimistic = true
    } = options;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            operationQueue.cancelResourceOperations(resourceType, 'crud');
        };
    }, [resourceType]);

    /**
     * Create operation with optimistic update
     */
    const create = useCallback(async (newItem, operation) => {
        if (!isMountedRef.current) return;

        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const optimisticItem = { ...newItem, id: tempId, _optimistic: true };

        try {
            // Optimistic update
            if (enableOptimistic) {
                setItems(current => [...current, optimisticItem]);
            }

            setLoading(true);
            setError(null);

            const result = await operationQueue.queueOperation(
                resourceType,
                'create',
                operation,
                {
                    priority: 'normal',
                    optimistic: enableOptimistic,
                    rollbackData: {
                        rollback: () => {
                            if (isMountedRef.current) {
                                setItems(current => current.filter(item => item.id !== tempId));
                            }
                        }
                    }
                }
            );

            if (!isMountedRef.current) return result;

            // Replace optimistic item with real item
            setItems(current =>
                current.map(item =>
                    item.id === tempId ? { ...result, _optimistic: false } : item
                )
            );

            if (onSuccess) onSuccess('created', result);
            setLoading(false);
            return result;

        } catch (err) {
            if (!isMountedRef.current) return;

            console.error(`[useCRUDOperations] Create failed for ${resourceType}:`, err);

            // Remove optimistic item on error
            setItems(current => current.filter(item => item.id !== tempId));

            const errorMsg = err.message || 'Create operation failed';
            setError(errorMsg);
            if (onError) onError('create', errorMsg);
            setLoading(false);

            throw err;
        }
    }, [resourceType, enableOptimistic, onSuccess, onError]);

    /**
     * Update operation with optimistic update
     */
    const update = useCallback(async (itemId, updates, operation) => {
        if (!isMountedRef.current) return;

        let previousItem = null;

        try {
            setLoading(true);
            setError(null);

            // Store previous state and apply optimistic update
            if (enableOptimistic) {
                setItems(current => {
                    const index = current.findIndex(item => item.id === itemId);
                    if (index === -1) return current;

                    previousItem = current[index];
                    const newItems = [...current];
                    newItems[index] = { ...previousItem, ...updates, _optimistic: true };
                    return newItems;
                });
            }

            const result = await operationQueue.queueOperation(
                resourceType,
                itemId,
                operation,
                {
                    priority: 'normal',
                    optimistic: enableOptimistic,
                    rollbackData: previousItem ? {
                        rollback: () => {
                            if (isMountedRef.current) {
                                setItems(current =>
                                    current.map(item => item.id === itemId ? previousItem : item)
                                );
                            }
                        }
                    } : null
                }
            );

            if (!isMountedRef.current) return result;

            // Update with real data
            setItems(current =>
                current.map(item =>
                    item.id === itemId ? { ...result, _optimistic: false } : item
                )
            );

            if (onSuccess) onSuccess('updated', result);
            setLoading(false);
            return result;

        } catch (err) {
            if (!isMountedRef.current) return;

            console.error(`[useCRUDOperations] Update failed for ${resourceType}:${itemId}:`, err);

            const errorMsg = err.message || 'Update operation failed';
            setError(errorMsg);
            if (onError) onError('update', errorMsg);
            setLoading(false);

            throw err;
        }
    }, [resourceType, enableOptimistic, onSuccess, onError]);

    /**
     * Delete operation with optimistic update
     */
    const remove = useCallback(async (itemId, operation) => {
        if (!isMountedRef.current) return;

        let deletedItem = null;

        try {
            setLoading(true);
            setError(null);

            // Optimistic removal
            if (enableOptimistic) {
                setItems(current => {
                    const index = current.findIndex(item => item.id === itemId);
                    if (index === -1) return current;

                    deletedItem = current[index];
                    return current.filter(item => item.id !== itemId);
                });
            }

            const result = await operationQueue.queueOperation(
                resourceType,
                itemId,
                operation,
                {
                    priority: 'high',
                    optimistic: enableOptimistic,
                    rollbackData: deletedItem ? {
                        rollback: () => {
                            if (isMountedRef.current) {
                                setItems(current => [...current, deletedItem]);
                            }
                        }
                    } : null
                }
            );

            if (onSuccess) onSuccess('deleted', result);
            setLoading(false);
            return result;

        } catch (err) {
            if (!isMountedRef.current) return;

            console.error(`[useCRUDOperations] Delete failed for ${resourceType}:${itemId}:`, err);

            const errorMsg = err.message || 'Delete operation failed';
            setError(errorMsg);
            if (onError) onError('delete', errorMsg);
            setLoading(false);

            throw err;
        }
    }, [resourceType, enableOptimistic, onSuccess, onError]);

    return {
        items,
        setItems,
        loading,
        error,
        create,
        update,
        remove,
        clearError: () => setError(null)
    };
}