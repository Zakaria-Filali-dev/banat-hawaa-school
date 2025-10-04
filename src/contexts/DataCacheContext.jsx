import React, { createContext, useContext, useState, useCallback } from "react";

/**
 * Data Cache Context for the Admin Dashboard
 * Provides caching functionality for frequently accessed data
 */
const DataCacheContext = createContext();

// Cache configuration
const CACHE_CONFIG = {
  // Cache expiry times in milliseconds
  TEACHERS: 5 * 60 * 1000, // 5 minutes
  SUBJECTS: 5 * 60 * 1000, // 5 minutes
  STUDENTS: 3 * 60 * 1000, // 3 minutes
  APPLICATIONS: 2 * 60 * 1000, // 2 minutes
  ANNOUNCEMENTS: 10 * 60 * 1000, // 10 minutes
  STATS: 1 * 60 * 1000, // 1 minute
};

// Cache keys
const CACHE_KEYS = {
  TEACHERS: "admin_teachers",
  SUBJECTS: "admin_subjects",
  STUDENTS: "admin_students",
  APPLICATIONS: "admin_applications",
  ANNOUNCEMENTS: "admin_announcements",
  STATS: "admin_stats",
};

/**
 * Data Cache Provider Component
 */
export const DataCacheProvider = ({ children }) => {
  const [cache, setCache] = useState(new Map());
  const [cacheMetadata, setCacheMetadata] = useState(new Map());

  // Check if cached data is still valid
  const isCacheValid = useCallback(
    (key) => {
      const metadata = cacheMetadata.get(key);
      if (!metadata) return false;

      const now = Date.now();
      const expiryTime =
        CACHE_CONFIG[key.toUpperCase().replace("ADMIN_", "")] || 5 * 60 * 1000;

      return now - metadata.timestamp < expiryTime;
    },
    [cacheMetadata]
  );

  // Get data from cache
  const getCachedData = useCallback(
    (key) => {
      if (!isCacheValid(key)) {
        // Remove expired data
        setCache((prev) => {
          const newCache = new Map(prev);
          newCache.delete(key);
          return newCache;
        });
        setCacheMetadata((prev) => {
          const newMetadata = new Map(prev);
          newMetadata.delete(key);
          return newMetadata;
        });
        return null;
      }

      return cache.get(key);
    },
    [cache, isCacheValid]
  );

  // Set data in cache
  const setCachedData = useCallback((key, data) => {
    setCache((prev) => {
      const newCache = new Map(prev);
      newCache.set(key, data);
      return newCache;
    });

    setCacheMetadata((prev) => {
      const newMetadata = new Map(prev);
      newMetadata.set(key, {
        timestamp: Date.now(),
        size: JSON.stringify(data).length,
      });
      return newMetadata;
    });
  }, []);

  // Invalidate specific cache entry
  const invalidateCache = useCallback((key) => {
    setCache((prev) => {
      const newCache = new Map(prev);
      newCache.delete(key);
      return newCache;
    });

    setCacheMetadata((prev) => {
      const newMetadata = new Map(prev);
      newMetadata.delete(key);
      return newMetadata;
    });
  }, []);

  // Clear all cache
  const clearCache = useCallback(() => {
    setCache(new Map());
    setCacheMetadata(new Map());
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const stats = {
      totalEntries: cache.size,
      totalSize: 0,
      entries: [],
    };

    for (const [key, data] of cache.entries()) {
      const metadata = cacheMetadata.get(key);
      const size = metadata?.size || JSON.stringify(data).length;
      const age = metadata ? Date.now() - metadata.timestamp : 0;

      stats.totalSize += size;
      stats.entries.push({
        key,
        size,
        age,
        valid: isCacheValid(key),
      });
    }

    return stats;
  }, [cache, cacheMetadata, isCacheValid]);

  // Cached fetch wrapper
  const cachedFetch = useCallback(
    async (key, fetchFunction, forceRefresh = false) => {
      // Check cache first unless forced refresh
      if (!forceRefresh) {
        const cachedData = getCachedData(key);
        if (cachedData !== null) {
          return {
            data: cachedData,
            fromCache: true,
            timestamp: cacheMetadata.get(key)?.timestamp,
          };
        }
      }

      // Fetch fresh data
      try {
        const freshData = await fetchFunction();
        setCachedData(key, freshData);

        return {
          data: freshData,
          fromCache: false,
          timestamp: Date.now(),
        };
      } catch (error) {
        // On error, return stale cache if available
        const staleData = cache.get(key);
        if (staleData !== undefined) {
          console.warn(
            `Fresh fetch failed for ${key}, returning stale cache:`,
            error
          );
          return {
            data: staleData,
            fromCache: true,
            stale: true,
            timestamp: cacheMetadata.get(key)?.timestamp,
            error,
          };
        }
        throw error;
      }
    },
    [getCachedData, setCachedData, cache, cacheMetadata]
  );

  // Preload cache with data
  const preloadCache = useCallback(
    async (preloadData) => {
      const promises = [];

      for (const [key, fetchFunction] of Object.entries(preloadData)) {
        if (typeof fetchFunction === "function") {
          promises.push(
            cachedFetch(key, fetchFunction).catch((error) => {
              console.warn(`Failed to preload ${key}:`, error);
              return null;
            })
          );
        }
      }

      const results = await Promise.allSettled(promises);
      return results.map((result, index) => ({
        key: Object.keys(preloadData)[index],
        success: result.status === "fulfilled",
        data: result.status === "fulfilled" ? result.value : null,
        error: result.status === "rejected" ? result.reason : null,
      }));
    },
    [cachedFetch]
  );

  const contextValue = {
    // Core cache operations
    getCachedData,
    setCachedData,
    invalidateCache,
    clearCache,

    // Advanced operations
    cachedFetch,
    preloadCache,

    // Cache management
    getCacheStats,
    isCacheValid,

    // Cache keys for convenience
    CACHE_KEYS,
  };

  return (
    <DataCacheContext.Provider value={contextValue}>
      {children}
    </DataCacheContext.Provider>
  );
};

/**
 * Hook to use data cache
 */
export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error("useDataCache must be used within a DataCacheProvider");
  }
  return context;
};

export default DataCacheContext;
