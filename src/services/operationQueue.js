/**
 * Enhanced Operation Queue Service
 * 
 * Prevents race conditions in CRUD operations by:
 * - Serializing related operations
 * - Implementing optimistic updates with rollback
 * - Handling concurrent operation conflicts  
 * - Providing operation status tracking
 * - Automatic retry with exponential backoff
 */
class OperationQueueService {
    constructor() {
        this.queues = new Map(); // Operation queues by resource type
        this.operations = new Map(); // Active operations tracking
        this.optimisticUpdates = new Map(); // Rollback data for optimistic updates
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000
        };
    }

    /**
     * Queue an operation for a specific resource
     */
    async queueOperation(resourceType, resourceId, operation, options = {}) {
        const {
            optimistic = false,
            rollbackData = null,
            priority = 'normal',
            timeout = 30000
        } = options;

        const operationId = `${resourceType}_${resourceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const queueKey = `${resourceType}_${resourceId}`;

        // Initialize queue for this resource if doesn't exist
        if (!this.queues.has(queueKey)) {
            this.queues.set(queueKey, []);
        }

        const operationPromise = new Promise((resolve, reject) => {
            const operationData = {
                id: operationId,
                resourceType,
                resourceId,
                operation,
                options,
                resolve,
                reject,
                timestamp: Date.now(),
                priority,
                retryCount: 0
            };

            // Handle optimistic update
            if (optimistic && rollbackData) {
                this.optimisticUpdates.set(operationId, rollbackData);
            }

            // Add to queue based on priority
            const queue = this.queues.get(queueKey);
            if (priority === 'high') {
                queue.unshift(operationData);
            } else {
                queue.push(operationData);
            }

            // Process queue for this resource
            this.processQueue(queueKey);

            // Set timeout
            setTimeout(() => {
                if (this.operations.has(operationId)) {
                    this.handleOperationFailure(operationId, new Error('Operation timeout'));
                }
            }, timeout);
        });

        return operationPromise;
    }

    /**
     * Process operations queue for a specific resource
     */
    async processQueue(queueKey) {
        const queue = this.queues.get(queueKey);
        if (!queue || queue.length === 0) return;

        // Check if already processing operations for this resource
        const hasActiveOperation = Array.from(this.operations.values())
            .some(op => `${op.resourceType}_${op.resourceId}` === queueKey);

        if (hasActiveOperation) return;

        const operationData = queue.shift();
        if (!operationData) return;

        this.operations.set(operationData.id, operationData);

        try {
            console.log(`[OperationQueue] Starting operation: ${operationData.id}`);

            const result = await operationData.operation();

            this.handleOperationSuccess(operationData.id, result);

            // Process next operation in queue
            setTimeout(() => this.processQueue(queueKey), 0);

        } catch (error) {
            console.error(`[OperationQueue] Operation failed: ${operationData.id}`, error);

            if (operationData.options.retries && operationData.retryCount < this.retryConfig.maxRetries) {
                await this.retryOperation(operationData);
            } else {
                this.handleOperationFailure(operationData.id, error);
            }

            // Continue processing queue even after failure
            setTimeout(() => this.processQueue(queueKey), 0);
        }
    }

    /**
     * Retry failed operation with exponential backoff
     */
    async retryOperation(operationData) {
        operationData.retryCount++;

        const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, operationData.retryCount - 1),
            this.retryConfig.maxDelay
        );

        console.log(`[OperationQueue] Retrying operation ${operationData.id} in ${delay}ms (attempt ${operationData.retryCount})`);

        setTimeout(async () => {
            try {
                const result = await operationData.operation();
                this.handleOperationSuccess(operationData.id, result);
            } catch (error) {
                if (operationData.retryCount < this.retryConfig.maxRetries) {
                    await this.retryOperation(operationData);
                } else {
                    console.error(`[OperationQueue] Max retries exceeded for operation ${operationData.id}`);
                    this.handleOperationFailure(operationData.id, error);
                }
            }
        }, delay);
    }

    /**
     * Handle successful operation completion
     */
    handleOperationSuccess(operationId, result) {
        const operation = this.operations.get(operationId);
        if (!operation) return;

        console.log(`[OperationQueue] Operation completed successfully: ${operationId}`);

        // Clean up optimistic update data
        this.optimisticUpdates.delete(operationId);

        // Remove from active operations
        this.operations.delete(operationId);

        // Resolve promise
        operation.resolve(result);
    }

    /**
     * Handle operation failure with rollback
     */
    handleOperationFailure(operationId, error) {
        const operation = this.operations.get(operationId);
        if (!operation) return;

        console.error(`[OperationQueue] Operation failed permanently: ${operationId}`, error);

        // Handle optimistic update rollback
        if (this.optimisticUpdates.has(operationId)) {
            const rollbackData = this.optimisticUpdates.get(operationId);
            console.log(`[OperationQueue] Rolling back optimistic update: ${operationId}`);

            try {
                if (typeof rollbackData.rollback === 'function') {
                    rollbackData.rollback();
                }
            } catch (rollbackError) {
                console.error(`[OperationQueue] Rollback failed: ${operationId}`, rollbackError);
            }

            this.optimisticUpdates.delete(operationId);
        }

        // Remove from active operations  
        this.operations.delete(operationId);

        // Reject promise
        operation.reject(error);
    }

    /**
     * Cancel a specific operation
     */
    cancelOperation(operationId) {
        // Remove from active operations
        if (this.operations.has(operationId)) {
            const operation = this.operations.get(operationId);
            this.operations.delete(operationId);
            operation.reject(new Error('Operation cancelled'));
        }

        // Remove from queues
        for (const [, queue] of this.queues.entries()) {
            const index = queue.findIndex(op => op.id === operationId);
            if (index !== -1) {
                const operation = queue.splice(index, 1)[0];
                operation.reject(new Error('Operation cancelled'));
                break;
            }
        }

        // Clean up optimistic update
        this.optimisticUpdates.delete(operationId);
    }

    /**
     * Cancel all operations for a specific resource
     */
    cancelResourceOperations(resourceType, resourceId) {
        const queueKey = `${resourceType}_${resourceId}`;

        // Cancel active operations
        for (const [operationId, operation] of this.operations.entries()) {
            if (operation.resourceType === resourceType && operation.resourceId === resourceId) {
                this.cancelOperation(operationId);
            }
        }

        // Clear queue
        if (this.queues.has(queueKey)) {
            const queue = this.queues.get(queueKey);
            while (queue.length > 0) {
                const operation = queue.pop();
                operation.reject(new Error('Operation cancelled'));
            }
        }
    }

    /**
     * Get operation status
     */
    getOperationStatus(operationId) {
        if (this.operations.has(operationId)) {
            const operation = this.operations.get(operationId);
            return {
                status: 'running',
                retryCount: operation.retryCount,
                timestamp: operation.timestamp
            };
        }

        // Check queues
        for (const queue of this.queues.values()) {
            const operation = queue.find(op => op.id === operationId);
            if (operation) {
                return {
                    status: 'queued',
                    position: queue.indexOf(operation),
                    timestamp: operation.timestamp
                };
            }
        }

        return {
            status: 'not_found'
        };
    }

    /**
     * Get queue statistics
     */
    getQueueStats() {
        const stats = {
            activeOperations: this.operations.size,
            queuedOperations: 0,
            totalQueues: this.queues.size,
            optimisticUpdates: this.optimisticUpdates.size
        };

        for (const queue of this.queues.values()) {
            stats.queuedOperations += queue.length;
        }

        return stats;
    }

    /**
     * Clear all operations and queues
     */
    clearAll() {
        // Cancel all active operations
        for (const [, operation] of this.operations.entries()) {
            operation.reject(new Error('Service shutdown'));
        }        // Cancel all queued operations
        for (const queue of this.queues.values()) {
            while (queue.length > 0) {
                const operation = queue.pop();
                operation.reject(new Error('Service shutdown'));
            }
        }

        this.operations.clear();
        this.queues.clear();
        this.optimisticUpdates.clear();
    }
}

// Export singleton instance
export const operationQueue = new OperationQueueService();

// Utility functions for common operations
export const queueUserOperation = (userId, operation, options = {}) => {
    return operationQueue.queueOperation('user', userId, operation, options);
};

export const queueSubjectOperation = (subjectId, operation, options = {}) => {
    return operationQueue.queueOperation('subject', subjectId, operation, options);
};

export const queueAnnouncementOperation = (announcementId, operation, options = {}) => {
    return operationQueue.queueOperation('announcement', announcementId, operation, options);
};

export const queueAssignmentOperation = (assignmentId, operation, options = {}) => {
    return operationQueue.queueOperation('assignment', assignmentId, operation, options);
};

export const queueSessionOperation = (sessionId, operation, options = {}) => {
    return operationQueue.queueOperation('session', sessionId, operation, options);
};

export default operationQueue;