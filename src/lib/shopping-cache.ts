import { ShoppingList } from '@/types/shopping';

const CACHE_PREFIX = 'shopping_list_';
const DEFAULT_CACHE_DURATION = 1000 * 60 * 60 * 2; // 2 hours in milliseconds

interface CachedShoppingData {
  data: ShoppingList;
  timestamp: number;
  expiresAt: number;
  cacheKey: string;
}

export class ShoppingCache {
  private static instance: ShoppingCache;

  static getInstance(): ShoppingCache {
    if (!ShoppingCache.instance) {
      ShoppingCache.instance = new ShoppingCache();
    }
    return ShoppingCache.instance;
  }

  /**
   * Generate a cache key based on meal ID and missing ingredients
   */
  private generateCacheKey(
    mealId: string, 
    missingIngredients: string[], 
    userLocation: { lat: number; lng: number }
  ): string {
    // Sort ingredients to ensure consistent cache keys
    const sortedIngredients = [...missingIngredients].sort();
    
    // Round location to 2 decimal places to group nearby locations
    const roundedLat = Math.round(userLocation.lat * 100) / 100;
    const roundedLng = Math.round(userLocation.lng * 100) / 100;
    
    // Create a hash-like key
    const ingredientsStr = sortedIngredients.join('|');
    const locationStr = `${roundedLat},${roundedLng}`;
    
    return `${CACHE_PREFIX}${mealId}_${this.simpleHash(ingredientsStr)}_${this.simpleHash(locationStr)}`;
  }

  /**
   * Simple hash function for creating shorter cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if cached data exists and is still valid
   */
  getCachedShoppingList(
    mealId: string,
    missingIngredients: string[],
    userLocation: { lat: number; lng: number }
  ): ShoppingList | null {
    try {
      const cacheKey = this.generateCacheKey(mealId, missingIngredients, userLocation);
      const cachedDataStr = localStorage.getItem(cacheKey);
      
      if (!cachedDataStr) {
        console.log(`🗂️ [ShoppingCache] No cached data found for key: ${cacheKey}`);
        return null;
      }

      const cachedData: CachedShoppingData = JSON.parse(cachedDataStr);
      const now = Date.now();

      // Check if cache has expired
      if (now > cachedData.expiresAt) {
        console.log(`⏰ [ShoppingCache] Cache expired for key: ${cacheKey}`);
        this.removeCachedData(cacheKey);
        return null;
      }

      console.log(`✅ [ShoppingCache] Found valid cached data for key: ${cacheKey}`);
      console.log(`🕒 [ShoppingCache] Cache expires in ${Math.round((cachedData.expiresAt - now) / 1000 / 60)} minutes`);
      
      return cachedData.data;
    } catch (error) {
      console.error('❌ [ShoppingCache] Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Cache shopping list data
   */
  cacheShoppingList(
    mealId: string,
    missingIngredients: string[],
    userLocation: { lat: number; lng: number },
    shoppingList: ShoppingList,
    cacheDurationMs: number = DEFAULT_CACHE_DURATION
  ): void {
    try {
      const cacheKey = this.generateCacheKey(mealId, missingIngredients, userLocation);
      const now = Date.now();
      
      const cachedData: CachedShoppingData = {
        data: shoppingList,
        timestamp: now,
        expiresAt: now + cacheDurationMs,
        cacheKey
      };

      localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      
      console.log(`💾 [ShoppingCache] Cached shopping list for key: ${cacheKey}`);
      console.log(`🕒 [ShoppingCache] Cache expires in ${Math.round(cacheDurationMs / 1000 / 60)} minutes`);
      
      // Clean up old cache entries
      this.cleanupExpiredCache();
    } catch (error) {
      console.error('❌ [ShoppingCache] Error caching data:', error);
    }
  }

  /**
   * Remove specific cached data
   */
  private removeCachedData(cacheKey: string): void {
    try {
      localStorage.removeItem(cacheKey);
      console.log(`🗑️ [ShoppingCache] Removed cached data for key: ${cacheKey}`);
    } catch (error) {
      console.error('❌ [ShoppingCache] Error removing cached data:', error);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      // Iterate through localStorage to find expired shopping cache entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          try {
            const cachedDataStr = localStorage.getItem(key);
            if (cachedDataStr) {
              const cachedData: CachedShoppingData = JSON.parse(cachedDataStr);
              if (now > cachedData.expiresAt) {
                keysToRemove.push(key);
              }
            }
          } catch (error) {
            // If we can't parse the data, it's corrupted - remove it
            keysToRemove.push(key);
          }
        }
      }

      // Remove expired entries
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      if (keysToRemove.length > 0) {
        console.log(`🧹 [ShoppingCache] Cleaned up ${keysToRemove.length} expired cache entries`);
      }
    } catch (error) {
      console.error('❌ [ShoppingCache] Error during cache cleanup:', error);
    }
  }

  /**
   * Clear all shopping cache data
   */
  clearAllCache(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`🗑️ [ShoppingCache] Cleared ${keysToRemove.length} cache entries`);
    } catch (error) {
      console.error('❌ [ShoppingCache] Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
    validEntries: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const stats = {
      totalEntries: 0,
      expiredEntries: 0,
      validEntries: 0,
      oldestEntry: null as Date | null,
      newestEntry: null as Date | null
    };

    try {
      const now = Date.now();
      let oldestTimestamp = Infinity;
      let newestTimestamp = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          stats.totalEntries++;
          
          try {
            const cachedDataStr = localStorage.getItem(key);
            if (cachedDataStr) {
              const cachedData: CachedShoppingData = JSON.parse(cachedDataStr);
              
              if (now > cachedData.expiresAt) {
                stats.expiredEntries++;
              } else {
                stats.validEntries++;
              }

              if (cachedData.timestamp < oldestTimestamp) {
                oldestTimestamp = cachedData.timestamp;
              }
              if (cachedData.timestamp > newestTimestamp) {
                newestTimestamp = cachedData.timestamp;
              }
            }
          } catch (error) {
            stats.expiredEntries++; // Count corrupted data as expired
          }
        }
      }

      if (oldestTimestamp !== Infinity) {
        stats.oldestEntry = new Date(oldestTimestamp);
      }
      if (newestTimestamp !== 0) {
        stats.newestEntry = new Date(newestTimestamp);
      }
    } catch (error) {
      console.error('❌ [ShoppingCache] Error getting cache stats:', error);
    }

    return stats;
  }
}