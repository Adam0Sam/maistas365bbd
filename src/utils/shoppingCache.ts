import { ShoppingList, APIRecipeResponse } from '@/types/shopping';

export interface CachedShoppingData {
  shoppingList: ShoppingList;
  apiResponse: APIRecipeResponse;
  cachedAt: string;
  expiresAt: string;
  cacheKey: string;
}

export class ShoppingCache {
  private static readonly CACHE_PREFIX = 'shopping_cache_';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Generate a unique cache key based on meal ID, missing ingredients, and user location
   */
  static generateCacheKey(
    mealId: string,
    missingIngredients: string[],
    userLocation: { lat: number; lng: number }
  ): string {
    // Sort ingredients to ensure consistent key regardless of order
    const sortedIngredients = [...missingIngredients].sort();
    
    // Round location to 2 decimal places to avoid cache misses for tiny location differences
    const roundedLat = Math.round(userLocation.lat * 100) / 100;
    const roundedLng = Math.round(userLocation.lng * 100) / 100;
    
    const keyData = {
      mealId,
      ingredients: sortedIngredients,
      location: `${roundedLat},${roundedLng}`
    };
    
    return btoa(JSON.stringify(keyData)).replace(/[+/=]/g, '');
  }

  /**
   * Save shopping data to cache
   */
  static setCachedData(
    cacheKey: string,
    shoppingList: ShoppingList,
    apiResponse: APIRecipeResponse
  ): void {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.CACHE_DURATION);
      
      const cachedData: CachedShoppingData = {
        shoppingList,
        apiResponse,
        cachedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        cacheKey
      };

      const storageKey = this.CACHE_PREFIX + cacheKey;
      localStorage.setItem(storageKey, JSON.stringify(cachedData));
      
      console.log(`💾 [ShoppingCache] Data cached for key: ${cacheKey.substring(0, 10)}...`);
    } catch (error) {
      console.warn('Failed to cache shopping data:', error);
    }
  }

  /**
   * Retrieve shopping data from cache
   */
  static getCachedData(cacheKey: string): CachedShoppingData | null {
    try {
      const storageKey = this.CACHE_PREFIX + cacheKey;
      const cachedItem = localStorage.getItem(storageKey);
      
      if (!cachedItem) {
        console.log(`📭 [ShoppingCache] No cached data found for key: ${cacheKey.substring(0, 10)}...`);
        return null;
      }

      const cachedData: CachedShoppingData = JSON.parse(cachedItem);
      
      // Check if cache has expired
      const now = new Date();
      const expiresAt = new Date(cachedData.expiresAt);
      
      if (now > expiresAt) {
        console.log(`⏰ [ShoppingCache] Cache expired for key: ${cacheKey.substring(0, 10)}...`);
        this.removeCachedData(cacheKey);
        return null;
      }

      const ageMinutes = Math.round((now.getTime() - new Date(cachedData.cachedAt).getTime()) / (1000 * 60));
      console.log(`📦 [ShoppingCache] Using cached data (age: ${ageMinutes}m) for key: ${cacheKey.substring(0, 10)}...`);
      
      return cachedData;
    } catch (error) {
      console.warn('Failed to retrieve cached shopping data:', error);
      return null;
    }
  }

  /**
   * Remove specific cached data
   */
  static removeCachedData(cacheKey: string): void {
    try {
      const storageKey = this.CACHE_PREFIX + cacheKey;
      localStorage.removeItem(storageKey);
      console.log(`🗑️ [ShoppingCache] Removed cached data for key: ${cacheKey.substring(0, 10)}...`);
    } catch (error) {
      console.warn('Failed to remove cached shopping data:', error);
    }
  }

  /**
   * Clear all shopping cache data
   */
  static clearAllCache(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      cacheKeys.forEach(key => localStorage.removeItem(key));
      
      console.log(`🧹 [ShoppingCache] Cleared ${cacheKeys.length} cached items`);
    } catch (error) {
      console.warn('Failed to clear shopping cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { count: number; totalSize: number; oldestAge: number | null } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      let totalSize = 0;
      let oldestAge: number | null = null;
      const now = new Date();

      cacheKeys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
          
          try {
            const cachedData: CachedShoppingData = JSON.parse(item);
            const age = now.getTime() - new Date(cachedData.cachedAt).getTime();
            if (oldestAge === null || age > oldestAge) {
              oldestAge = age;
            }
          } catch (e) {
            // Ignore parsing errors for stats
          }
        }
      });

      return {
        count: cacheKeys.length,
        totalSize,
        oldestAge: oldestAge ? Math.round(oldestAge / (1000 * 60)) : null // in minutes
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return { count: 0, totalSize: 0, oldestAge: null };
    }
  }

  /**
   * Check if browser supports localStorage
   */
  static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
}